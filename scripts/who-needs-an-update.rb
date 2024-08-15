#!/usr/bin/env ruby
require 'json'

Dir.chdir('src')

Dir.foreach('.') do |filename|
    next if filename == '.' or filename == '..' or filename == 'bad-extension'

    Dir.chdir filename

    if not File.file? 'package.json'
      puts "No package.json found in #{Dir.pwd}, skipping..."
      next
    end

    npm_info = `npm info --json`
    as_json = JSON.parse(npm_info)

    name = as_json['name']
    current_version = as_json['dist-tags']['latest']
    main_file = as_json['main']

    #puts "Checking #{name}@#{current_version}"

    `curl -sS https://unpkg.com/#{name}@#{current_version}/#{main_file} > tmp.js`

    diff = `diff #{main_file} tmp.js`

    if  not diff.empty?
      puts "  --> !!!!!!! #{name}@#{current_version} REQUIRES UPDATE !!!!!!!"
      package_info = File.read('package.json')
      package_info_as_json = JSON.parse(package_info)
      if current_version == package_info_as_json['version']
        puts "      --> !!!!!!! package.json NEEDS VERSION BUMP !!!!!!!"
      end
    end

    `rm tmp.js`

    Dir.chdir ".."
end

