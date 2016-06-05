var
  fs = require("fs"),
  request = require("request"),
  cheerio = require("cheerio");
  
var
  dept_url = "http://ucsd.edu/catalog/courses/",
  depts_url = "http://ucsd.edu/catalog/front/courses.html",
  dept_urls = [],
  courses = [],
  index = 0,
  current = 0,
  max = 10;

var reg = {
  url: /\.\.\/courses\/([A-Z]+\.html)/g,
  dept: /([A-Z]+)\.html/,
  num: /[0-9][0-9A-Z]*/
}

var get_depts = function () {
  request(depts_url, function (err, res, body) {
    if (err) {
      console.log(err);
      return;
    }
    
    var m;
    while (m = reg.url.exec(body)) 
      dept_urls.push(dept_url + m[1]);
    
    // console.log(dept_urls.length);
    get_courses();
  });
}

var get_courses = function () {
  if (current == max || index == dept_urls.length) return; 
  
  var url = dept_urls[index++]
  var dept = reg.dept.exec(url)[1];
  
  current++;
  request(url, function (err, res, body) {
    current--;
    get_courses();
    
    if (err) {
      console.log(err);
      dept_urls.push(url);
      return;
    }
    
    if (res.statusCode != 200) {
      console.log(url + ": " + res.statusCode);
      return;
    }
    
    var $ = cheerio.load(body);
    $(".course-name").each(function () {
      var full = $(this).text()
        .replace(/[\s]/g, " ")
        .replace(/\ {2,}/g, " ")
        .replace(/[–—]/g, "-")
        .trim();
      
      var units, num, desc, split;
      
      var course = {
        dept: null,
        num: null,
        title: null,
        desc: null,
        units: null
      }
        
      // skip empty course-name
      if (!/[A-z]/.test(full)) return;
      
      // ignore graduate courses
      num = reg.num.exec(full);
      if (parseInt(num) > 199) return;
      
      // split on course num
      num = /([0-9][0-9A-Z\-]*)[\.:]\ ?/.exec(full);
      if (!num) num = /([0-9][0-9A-Z \-]*)\./.exec(full);
      if (!num) num = /([0-9][0-9A-Z]*)\ /.exec(full);
      if (!num) return;// console.log(dept, "-", full);
      
      full = full.split(num[0]);
      full[0] += num[1];
      
      units = /\(([0-9][^)]*)\)$/.exec(full[1]);
      if (units) {
        full[1] = full[1].split(units[0])[0];
        units = units[1];
      }
      
      course.units = units;
      course.title = full[1].trim();
      
      // missing dept
      if (/^[0-9]/.test(full[0]))
        full[0] = dept + " " + full[0];
      
      // no valid dept / extra words
      if (/[A-Za-z]{5,}/.test(full[0])) {
        var d = /[A-Z]{2,}/.exec(full[0]);
        d = d && d[0] || dept;
        full[0] = d + full[0].substr(/\ [0-9]/.exec(full[0]).index);
      }
      
      split = full[0].split("/");
      full[0] = split[0];
      if (!/[0-9]/.test(full[0]))
        full[0] += " " + /[0-9][0-9A-Z]*/.exec(split[split.length-1])[0];
      
      var i = full[0].indexOf(" ");
      course.dept = full[0].substr(0, i);
      if (course.dept == "LING") course.dept = "LIGN";
            
      desc = $(this).next("p:not(.course-name)");
      while (!desc.text()) desc = desc.next("p");
      desc = desc.text().trim()
        .replace(/[\n\t]/g, " ")
        .replace(/\ {2,}/g, " ");
      
      if (/^\((see entry|no longer)/i.test(desc.trim())) return;
      
      course.desc = desc;
      
      var i = desc.indexOf("Prerequisites: ");
      if (~i) {
        course.desc = desc.substr(0, i);
        course.prereqs = desc.substr(i + 15);
      } else {
        course.prereqs = "none.";
      }

      var match = /0*([1-9][0-9]*)\s*((?:[A-Z]-?(?: , )?(?: or )?)*)/.exec(num[1])
      if (!match[2]) match[2] = "";
      var nums = match[2].split(/-?(?: or )?(?: , )?/);
      if (nums.length == 2 && nums[1].charAt(0) != String.fromCharCode(nums[0].charCodeAt(0) + 1)) {
        var cur_char = nums[0].charAt(0);
        var rest = nums[0].substring(1);
        while (cur_char != nums[1].charAt(0)) {
            cur_char = String.fromCharCode(cur_char.charCodeAt(0) + 1);
            nums.push(cur_char + rest);
        }
      }

      var number = match[1];
      for (var i = 0; i < nums.length; i++) {
          course.num = number + nums[i];
          if (nums.length > 1) console.log(course.num);
          courses.push(course);
      }
    });
    check_is_done();
  });
  
  get_courses();
}

var check_is_done = function () {
  if (index != dept_urls.length || current) return;
  
  // this is where the scrape finishes
  var catalog = "catalog = " + JSON.stringify(courses);
  fs.writeFile("catalog.json", catalog, function (err) {
    console.log(!err);
  });
  //post_course();
}

var post_course = function () {
  if (current == max || index == courses.length) return;
  
  var c = courses[index++];
  console.log(index, "/", courses.length);
  
  var course = {
    course_id: c.dept + " " + c.num,
    course_name: c.title,
    description: c.desc,
    prereqs: c.prereqs,
    units: c.units
  }
  
  current++;
  request({
    method: "POST",
    url: api,
    headers: {
      "Content-Type": "application/json"
    },
    json: course
  }, function (err, res, body) {
    current--;
    post_course();
    
    if (err)
      console.log(JSON.stringify(course));
    // else
    //   console.log(course.course_id, "done");
  });
  
  post_course();
}


get_depts();
