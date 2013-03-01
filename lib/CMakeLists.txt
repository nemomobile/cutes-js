FILE(GLOB JS_FILES *.js)
FILE(GLOB NARWHAL_FILES narwhal/*.js)
install(FILES ${JS_FILES} DESTINATION share/cutes)
install(FILES ${NARWHAL_FILES} DESTINATION share/cutes/narwhal)
