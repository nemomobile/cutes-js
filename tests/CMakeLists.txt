add_custom_target(check COMMAND ${CMAKE_CTEST_COMMAND})
enable_testing()
add_test(test ./run)
add_dependencies(check test)
