PROJECT(MER_VAULT NONE)
cmake_minimum_required(VERSION 2.8)

include_directories(
  ${CMAKE_CURRENT_SOURCE_DIR}/cor/include
)

add_subdirectory(lib)

FILE(GLOB JSON_FILES json/*.js)
install(FILES ${JSON_FILES} DESTINATION share/cutes/json)
