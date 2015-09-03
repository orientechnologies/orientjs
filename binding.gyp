{
  "targets": [
    {
      "target_name": "deserializer",
      "sources": [ "lib/native/deserializer.cc",
                  "lib/native/orientc_reader.cpp",
                  "lib/native/listener.cc",
                  "lib/native/helpers.cpp",
                  "lib/native/parse_exception.cpp" ],
      "include_dirs": [
              "<!(node -e \"require('nan')\")"
            ],
             'cflags!': [ '-fno-exceptions' ],
                  'cflags_cc!': [ '-fno-exceptions' ],
                  'conditions': [
                    ['OS=="mac"', {
                      'xcode_settings': {
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
                      }
                    }]
                  ]
    }
  ]
}