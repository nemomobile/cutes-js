#!/usr/bin/python

import os, sys, re, shutil, string
from subprocess import PIPE, Popen
from glob import glob
from datetime import datetime
import traceback

class Error(Exception):
    def __init__(self, msg, *args, **kwargs):
        super(Error, self).__init__(msg.format(*args, **kwargs))

def error(fmt, *args, **kwargs):
    raise Error(fmt.format(*args, **kwargs))

def trace(fmt, *args, **kwargs):
    print fmt.format(*args, **kwargs)

def date_iso(d):
    return '{:04d}-{:02d}-{:02d}_{:02d}-{:02d}-{:02d}.{}'\
        .format(d.year, d.month, d.day, d.hour,
                d.minute, d.second, d.microsecond)

def collect(container, fn, *args, **kwargs):
    res = []
    p = container.__iter__()
    try:
        while True:
            res.append(fn(p, *args, **kwargs))
    except StopIteration:
        pass
    return res

def items(*args):
    return args

def shell(cwd, cmd, *args):
    #trace("Execute {} with {}", cmd, args)
    p = Popen(items(cmd, *args), stdout=PIPE, stderr=PIPE, cwd = cwd)
    out, err = p.communicate()
    return out, err, p.returncode

def rmtree(path):
    os.path.exists(path) and shutil.rmtree(path)

def filter_comments(lines):
    return filter(lambda l: not re.match(r'^/s*#', l), lines)

class Git(object):
    def __init__(self, git_dir):
        self.__path = git_dir
        def mk_op(name):
            return lambda *args: shell(git_dir, "git", *items(name, *args))
        ops = ["status", "commit", "add", "init",
               "branch", "tag", "rm",
               ("hash-object", "hash_object"),
               "checkout", "reset", "clean", "config"]
        [setattr(self, op, mk_op(op)) if isinstance(op, str) \
             else setattr(self, op[1], mk_op(op[0])) \
             for op in ops]

    @property
    def is_exists(self):
        return os.path.isdir(self.__path) and self.status()[2] == 0

    @property
    def storage(self):
        return os.path.join(self.__path, '.git')

    def init_if_new(self):
        if self.is_exists:
            o, e, res = self.status()
            res and error("Can't get repo status @ {}", self.__path)
            return False
        trace("Init new git repository @ {}", self.__path)
        o, e, res = self.init()
        res and error("Can't init repo @ {}", self.__path)
        return True

class Status(object):
    __ids = {'D' : 'delete',
             'M' : 'modify',
             'A' : 'add',
             'R' : 'rename',
             'C' : 'copy',
             'U' : 'unmerge',
             '?' : 'unknown',
             'T' : 'type',
             ' ' : None }


    __bin = ('rename', 'copy')

    def __init__(self):
        self.src, self.dst, self.tree, self.idx = None, None, None, None

    def __repr__(self):
        if self.src:
            if self.dst:
                fmt = '{src} -> {dst}({tree}, {idx})'
            else:
                fmt =  '{src}({tree}, {idx})'
        else:
            if not self.dst:
                error("No paths")
            fmt = '->{dst}({tree}, {idx})'
        return fmt.format(src = self.src, tree = self.tree,
                          dst = self.dst, idx = self.idx)

    @staticmethod
    def get(git, path = None):
        params = ['-z']
        if path:
            params.extend(['--', path])

        out, err, res = git.status(*params)
        res and error("Error status {}, \noutput:\n{}\nerr:\n{}", res, out, err)
        info = filter(lambda s: len(s) != 0, out.split('\0'))

        def parse_state(iterator):
            l = iterator.next()
            item = Status()
            item.idx, item.tree = Status.__ids[l[0]], Status.__ids[l[1]]
            item.src = l[l.find(' ', 2) + 1:]
            if (item.idx in Status.__bin) or (item.tree in Status.__bin):
                item.dst = iterator.next()

            return item

        return collect(info, parse_state)

class Dir(object):
    def __init__(self, *path):
        self._name = os.path.join(*path)
        os.path.exists(self._name) or os.makedirs(self._name)

    def __str__(self):
        return self._name

    __repr__ = __str__

    def subdir(self, *path):
        return Dir(self._name, *path)

    def subpath(self, *path):
        return os.path.join(self._name, *path)
