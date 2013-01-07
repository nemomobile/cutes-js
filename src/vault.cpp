#include <QCoreApplication>
#include <QString>
#include <QProcess>
#include <QDebug>
#include <QDir>
#include <QScriptEngine>
#include <QSharedPointer>
#include <cor/options.hpp>
#include <cor/error.hpp>
#include <unordered_map>

class Error : public std::runtime_error
{
public:
    Error(QString const &s)
        : std::runtime_error(s.toStdString())
    { }

    virtual void print_trace() const
    {
        for (auto s : trace)
            std::cerr << s << std::endl;
    }

private:
    cor::Backtrace<30> trace;
};

class Process
{
public:
    Process(QString const &cmd, QString const &cwd = "")
        : cmd_(cmd)
    {
        if (cwd != "")
            p_.setWorkingDirectory(cwd);
    }

    int execute(QStringList const &);
    
    QByteArray stdout()
    {
        return p_.readAllStandardOutput();
    }

    QByteArray stderr()
    {
        return p_.readAllStandardError();
    }

    QString cwd() const
    {
        return p_.workingDirectory();
    }
    
private:
    QProcess p_;
    QString cmd_;
};

int Process::execute(QStringList const &args)
{
    p_.start(cmd_, args);
    p_.waitForFinished();
    return p_.exitStatus();
}

template <typename ... Args>
int shell(QString const &cmd, Args... args)
{
    Process p(cmd);
    return p.execute(QStringList({args...}));
}

template <typename T, typename FnT>
void erase_if(QList<T> &src, FnT fn)
{
    for (auto cur = src.begin(); cur != src.end();)
        if (fn(*cur))
            cur = src.erase(cur);
        else
            ++cur;
}

bool mkdir(QString const& path)
{
    bool is_created = false;
    QDir d(path);
    if (!d.exists()) {
        is_created = true;
        auto name = d.dirName();
        if (!d.cdUp())
            throw Error(QString("Parent dir %1 is unaccesible").arg(path));
        if (!d.mkdir(name))
            throw Error(QString("Can't create %1 in %2").arg(name, d.path()));
    }
}

namespace git
{

class Git : public Process
{

public:
    Git(QString const &root)
        : Process("git", root)
    {
    }

    template <typename ... Args>
    int command(QString const &name, Args&... args)
    {
        return execute(QStringList({name, args...}));
    }

    int command(QString const &name, QStringList const &params)
    {
        return execute(QStringList({name}) + params);
    }

    int config(QString const &name, QString const &value)
    {
        return command("config", name, value);
    }

    template <typename ... Args>
    int commit(QString const &msg, Args&... args)
    {
        return command("commit", "-m", msg, args...);
    }

    template <typename ... Args>
    int status(Args&... args)
    {
        return command("status", "-z", args...);
    }

};

class Status
{
public:

    enum Ids {
        Nop = ' ',
        Delete = 'D',
        Modify = 'M',
        Add = 'A',
        Rename = 'R',
        Copy = 'C',
        Unmerge = 'U',
        Unknown = '?',
        Type = 'T'
    };

    Status(Ids idx, Ids tree, QString const &src)
        : idx_(idx), tree_(tree), src_(src)
    { }

    static QList<Status> get(Git &, QString const &path = "");

    bool isBinary() const
    {
        return bin_ops_.count(idx_) || bin_ops_.count(tree_);
    }

    void setDst(QString const &s)
    {
        dst_ = s;
    }

    QString toString() const;
    
    char idx_chr() const { return (char)idx_; }
    char tree_chr() const { return (char)tree_; }

private:

    static std::unordered_map<char, Ids> ids_;
    static std::set<Ids> bin_ops_;

    Ids idx_;
    Ids tree_;
    QString src_;
    QString dst_;
};

std::unordered_map<char, Status::Ids> Status::ids_= {
    {' ', Status::Nop},
    {'D', Status::Delete},
    {'M', Status::Modify},
    {'A', Status::Add},
    {'R', Status::Rename},
    {'C', Status::Copy},
    {'U', Status::Unmerge},
    {'?', Status::Unknown},
    {'T', Status::Type}
};

std::set<Status::Ids> Status::bin_ops_ = {
    Status::Rename,
    Status::Copy
};

QString Status::toString() const
{
    return (dst_.isEmpty()
            ? QString("%1 (%2, %3)").arg
            (src_, (QChar)idx_, (QChar)tree_)
            : QString("%1 -> %2 (%3, %4)").arg
            (src_, dst_, (QChar)idx_, (QChar)tree_));
}

QList<Status> Status::get(Git &ps, QString const &path)
{
    int rc = (path != ""
              ? ps.status("--", path)
              : ps.status());
    if (rc) {
        qDebug() << "Error on status" << rc << "\n" << ps.stderr();
        throw cor::Error("status");
    }
    QList<Status> res;
    QList<QByteArray> items(ps.stdout().split('\0'));
    erase_if(items, [](QByteArray const &v) {return v.length() == 0; });
    for (auto cur = items.begin(); cur != items.end(); ++cur) {
        auto &v = *cur;
        if (v.length() < 4 && v[2] != ' ') {
            qDebug() << "Unexpected status item format:" << v;
            throw cor::Error("Parsing status");
        }
        Status s(ids_[v[0]], ids_[v[1]], v.mid(3));
        if (s.isBinary()) {
            ++cur;
            if (cur == items.end()) {
                qDebug() << "No dst after bin op chunk";
                throw cor::Error("No dst after bin op chunk");
            }
            s.setDst(*cur);
        }
        res.append(s);
    }
    return res;
}

}


class VaultFactory
{
public:
    VaultFactory(QString const &path)
        : initialized_(false),
          git_(new git::Git(path)),
          dir_(git_->cwd())
    {
    }
    ~VaultFactory()
    {
        if (!initialized_ && dir_.exists())
            shell("rm", "-rf", git_->cwd());
    }
    QSharedPointer<git::Git> create()
    {
        mkdir(git_->cwd());
        init();

        initialized_ = true;
        return git_;
    }
private:
    void init()
    {
        static auto err = [this](QString const &msg) {
            throw Error(QString
                        ("Dir %1: %2\nstderr:\n%3")
                        .arg(git_->cwd(), msg, QString(git_->stderr())));
        };
        if (dir_.exists(".git")) {
            if (git_->status())
                err("Invalid repository status");
        } else {
            if (git_->command("init"))
                err("Can't init repository");

            git_->config("user.email", "email");
            git_->config("user.name", "user");
            git_->config("status.showUntrackedFiles", "all");
        }
    }

    bool initialized_;
    QSharedPointer<git::Git> git_;
    QDir dir_;
};

QSharedPointer<git::Git> init_vault(QString const &path)
{
    VaultFactory f(path);
    return f.create();
}

int main(int argc, char *argv[])
{
    typedef cor::OptParse<QString> option_parser_type;
    option_parser_type::map_type opts;
    std::vector<char const*> params;
    option_parser_type options
        ({{'c', "config"}, {'H', "home"}, {'V', "vault"}, {'a', "action"}},
         {{"config", "config"}, {"home", "home"}, {"action", "action"}},
         {"config", "home", "action", "vault"});
    options.parse(argc, argv, opts, params);
    
    std::cout << "Vault " << opts["vault"] << std::endl;
    QCoreApplication app(argc, argv);
    QScriptEngine engine;
    qDebug << engine.evaluate("2 +4").toNumber();
    auto g = init_vault(opts["vault"]);
    auto s = git::Status::get(*g, ".");
    for (auto &v : s)
        qDebug() << v.toString();
    
    return 0;//app.exec();
}
