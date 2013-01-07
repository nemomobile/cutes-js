find_package(Qt4 4.7.0 REQUIRED)
include(${QT_USE_FILE})
set(CMAKE_CXX_FLAGS "${CMAKE_C_FLAGS} -Wno-psabi -std=c++0x")
