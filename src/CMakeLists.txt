find_package(Qt4 4.7.0 REQUIRED)
include(${QT_USE_FILE})
set(CMAKE_CXX_FLAGS "${CMAKE_C_FLAGS} -Wno-psabi -std=c++0x")

include_directories(
  ${QT_INCLUDE_DIR}
)

add_executable(mer-vault vault.cpp)
target_link_libraries(mer-vault
  ${QT_QTCORE_LIBRARY}
  ${QT_QTSCRIPT_LIBRARY}
  )
