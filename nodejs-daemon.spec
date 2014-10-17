%define         pkg daemon
%define         nodejs_libdir /usr/lib/node_modules
Summary:        Turn a node script into a daemon.
Name:           nodejs-daemon
Version:        1.1.0
Release:        1%{?dist}
License:        MIT
Group:          Development/Libraries
URL:            https://github.com/indexzero/daemon.node

BuildRequires:  nodejs
Requires:       nodejs
Source0:        nodejs-daemon-%{version}.tar.gz
BuildRoot:       %{_tmppath}/%{name}-%{version}-%{release}


%description
Turn a node script into a daemon.

%prep

%setup -c

%install
rm -rf ${RPM_BUILD_ROOT}

install -d $RPM_BUILD_ROOT%{nodejs_libdir}/%{pkg}
cp package.json index.js $RPM_BUILD_ROOT%{nodejs_libdir}/%{pkg}/

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(644, root, root, 755)
%doc README.md LICENSE
%dir %{nodejs_libdir}/%{pkg}
%{nodejs_libdir}/%{pkg}/package.json
%{nodejs_libdir}/%{pkg}/index.js



%changelog
