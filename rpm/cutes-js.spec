Summary: Javascript libraries for cutes
Name: cutes-js
Version: 0.5.3
Release: 1
License: LGPL21
Group: System Environment/Tools
URL: https://github.com/deztructor/cutes-js
Source0: %{name}-%{version}.tar.bz2
BuildArch: noarch
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-buildroot
Requires: cutes >= 0.6.1
Requires: qtscriptbindings-core
BuildRequires: cmake

%description
Miscelaneous javascript libraries created or adopted to be used with cutes
qtscript execution environment

%package -n narwhal
Summary: Narwhal javascript library
Group: System Environment/Libraries
License: MIT
%description -n narwhal
Part of Narwhal javascript library adopted to be used with cutes

%package -n json-js
Summary: Canonical javascript json parser
License: Public Domain
Group: System Environment/Libraries
%description -n json-js
Canonical javascript json parser from Douglas Crockford

%define jslibdir %{_datadir}/cutes

%prep
%setup -q

%build
%cmake
make %{?jobs:-j%jobs}

%install
rm -rf %{buildroot}
install -d -D -p -m755 %{buildroot}%{jslibdir}/
make install DESTDIR=%{buildroot}

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{jslibdir}/*.js

%files -n json-js
%defattr(-,root,root,-)
%{jslibdir}/json/*.js
%doc json/README

%files -n narwhal
%defattr(-,root,root,-)
%{jslibdir}/narwhal/*.js
%doc README-narwhal.md

