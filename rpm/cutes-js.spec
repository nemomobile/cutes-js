Summary: Javascript libraries for cutes
Name: cutes-js
Version: 0.0.0
Release: 0
License: LGPL21
Group: System Environment/Tools
URL: https://github.com/deztructor/cutes-js
Source0: %{name}-%{version}.tar.bz2
BuildArch: noarch
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-buildroot
Requires: cutes >= 0.8.0
Requires: qtscriptbindings-core
Requires: cutes-narwhal = %{version}, cutes-json-js = %{version}
Requires: coreutils >= 6.9
BuildRequires: cmake >= 2.8

%description
Miscelaneous javascript libraries created or adopted to be used with cutes
qtscript execution environment

%package -n cutes-narwhal
Summary: Narwhal javascript library
Group: System Environment/Libraries
License: MIT
%description -n cutes-narwhal
Part of Narwhal javascript library adopted to be used with cutes

%package -n cutes-json-js
Summary: Canonical javascript json parser
License: Public Domain
Group: System Environment/Libraries
%description -n cutes-json-js
Canonical javascript json parser from Douglas Crockford

%package -n cutes-coffee-script
Summary: CoffeeScript compiler for cutes
License: MPL-2.0
Group: Applications/Libraries
%description -n cutes-coffee-script
CoffeeScript compiler for cutes

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

%files -n cutes-json-js
%defattr(-,root,root,-)
%{jslibdir}/json/*.js
%doc json/README

%files -n cutes-narwhal
%defattr(-,root,root,-)
%{jslibdir}/narwhal/*.js
%doc README-narwhal.md

%files -n cutes-coffee-script
%defattr(-,root,root,-)
%{jslibdir}/coffee/*.js
%{_bindir}/coffee-script-compile
%doc coffee/README
%doc coffee/COPYING
