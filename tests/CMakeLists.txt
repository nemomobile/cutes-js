set(TESTS_DIR /opt/tests/cutes-js)

add_custom_target(check COMMAND ${CMAKE_CTEST_COMMAND})
enable_testing()
add_test(test ./run)
add_dependencies(check test)

FILE(GLOB JS_FILES test_*.js)
FILE(GLOB SH_FILES *.sh)

configure_file(tests.xml.in tests.xml @ONLY)

install(PROGRAMS
  run ${SH_FILES}
  DESTINATION ${TESTS_DIR}
  )

install(FILES
  tests.xml local-module.js ${JS_FILES}
  DESTINATION ${TESTS_DIR}
  )
