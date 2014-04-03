set(TESTS_DIR /opt/tests/cutes-js)

add_custom_target(check COMMAND ${CMAKE_CTEST_COMMAND})
enable_testing()
add_test(test ./run)
add_dependencies(check test)

FILE(GLOB JS_FILES test_*.js)

install(
  FILES run ${JS_FILES}
  DESTINATION ${TESTS_DIR}
)

configure_file(tests.xml.in tests.xml @ONLY)
install(
  FILES tests.xml
  DESTINATION ${TESTS_DIR}
)
