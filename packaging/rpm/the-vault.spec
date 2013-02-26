Summary: Backup/restore middleware and cli
Name: the-vault
Version: 0.2
Release: 1
License: LGPL21
Group: System Environment/Tools
URL: https://github.com/nemomobile/the-vault
Source0: %{name}-%{version}.tar.bz2
BuildArch: noarch
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-buildroot
Requires: qtscript-cli
Requires: qtscriptbindings-core

%description
Library and command line application providing backup/restore
framework. It uses approach somehow similar to git-annex to use git to
handle changes and separately manage blobs. Additionally to command
line interface it provides QtScript API

%package examples
Summary: Examples of backup scripts
Group: System Environment/Libraries
Requires: the-vault
%description examples
Examples of backup scripts

%package -n qtscript-modules
Summary: QtScript library
Group: System Environment/Libraries
%description -n qtscript-modules
QtScript library providing different functionality

%package -n json-js
Summary: Canonical javascript json parser
License: Public Domain
Group: System Environment/Libraries
%description -n json-js
Canonical javascript json parser from Douglas Crockford

%prep
%setup -q

%build

%install
rm -rf %{buildroot}
install -d -D -p -m755 %{buildroot}%{_datadir}/qtscript/
install -D -p -m644 lib/*.js %{buildroot}%{_datadir}/qtscript/
install -d -D -p -m755 %{buildroot}%{_datadir}/qtscript/json/
install -D -p -m644 json/*.js %{buildroot}%{_datadir}/qtscript/json/

install -d -D -p -m755 %{buildroot}%{_datadir}/the-vault/
install -D -p -m644 src/*.js %{buildroot}%{_datadir}/the-vault/
install -d -D -p -m755 %{buildroot}%{_datadir}/the-vault/examples/
install -D -p -m644 examples/scripts/pictures.js %{buildroot}%{_datadir}/the-vault/examples/

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_datadir}/the-vault/*.js

%files examples
%defattr(-,root,root,-)
%{_datadir}/the-vault/examples/*.js

%files -n qtscript-modules
%defattr(-,root,root,-)
%{_datadir}/qtscript/*.js

%files -n json-js
%defattr(-,root,root,-)
%{_datadir}/qtscript/json/*.js
%doc json/README

