PROJECT(CUTES-JS NONE)
cmake_minimum_required(VERSION 2.8)

include_directories(
  ${CMAKE_CURRENT_SOURCE_DIR}/cor/include
)

add_subdirectory(lib)
add_subdirectory(coffee)
add_subdirectory(tests)

FILE(GLOB JSON_FILES json/*.js)
install(FILES ${JSON_FILES} DESTINATION share/cutes/json)

install(FILES underscore/underscore-min.js DESTINATION share/cutes RENAME underscore.js)
