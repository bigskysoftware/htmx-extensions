#!/usr/bin/env ruby
require 'json'

`npm install`
`npm run dist`

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

    package_info_as_json = JSON.parse(File.read('package.json'))
    local_version = package_info_as_json['version']
    #puts "Checking #{name}@#{current_version}"

    `curl -sS https://unpkg.com/#{name}@#{current_version}/#{main_file} > tmp.js`

    diff = `diff #{main_file} tmp.js`

    if not diff.empty?
      puts "  --> !!!!!!! #{name}@#{current_version} REQUIRES A RELEASE !!!!!!!"
      if current_version == local_version
        puts "      --> !!!!!!! package.json NEEDS VERSION BUMP !!!!!!!"
      end
    elsif current_version != local_version
      puts "  --> !!!!!!! #{name}@#{current_version} REQUIRES A RELEASE !!!!!!!"
    end

    `rm tmp.js`

    Dir.chdir ".."
end

