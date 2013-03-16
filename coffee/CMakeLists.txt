FILE(GLOB JS_FILES coffee-*.js)
INSTALL(FILES ${JS_FILES} DESTINATION share/cutes/coffee)
INSTALL(PROGRAMS coffee-script-compile DESTINATION bin)
