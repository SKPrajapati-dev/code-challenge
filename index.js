const mysql = require('mysql2/promise');
require('dotenv').config();
const config = require('./config');
const express = require('express');
let conn;

const app = express();

app.get('/', async (req, res) => {
   try {
      let result = [];
      const { name, level, country } = req.query;
      if (name && level && country) {
         [result] = await conn.query(
            `SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id AND
         (c.course_name = "${name}" OR u.university_name = "${name}") AND el.level_name = "${level}" AND co.country_name = "${country}"`
         )
      } else if (name && level) {
         [result] = await conn.query(
            `SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id AND
         (c.course_name = "${name}" OR u.university_name = "${name}") AND el.level_name = "${level}"`
         )
      } else if (name && country) {
         [result] = await conn.query(
            `SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id AND
         (c.course_name = "${name}" OR u.university_name = "${name}") AND co.country_name = "${country}"`
         )
      } else if (country && level) {
         [result] = await conn.query(`SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id AND
         el.level_name = "${level}" AND co.country_name = "${country}"`)
      } else if (name) {
         [result] = await conn.query(`SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id AND
         (c.course_name = "${name}" OR u.university_name = "${name}")`)
      } else if (level) {
         [result] = await conn.query(`SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id AND
         el.level_name = "${level}"`)
      } else if (country) {
         [result] = await conn.query(`SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id AND
         co.country_name = "${country}"`)
      } else {
         [result] = await conn.query(
            `SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
         AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id`
         )
      }
      // const [result] = await conn.query(
      //    `SELECT * FROM Course c, Scholarship s, EducationLevel el, Country co, University u WHERE  c.university_id = s.university_id AND c.level_id = s.level_id
      //    AND el.level_id = c.level_id AND c.university_id = u.university_id AND u.country_id = co.country_id`
      // )
      const [avg] = await conn.query(
         `SELECT university_id, AVG(annual_tuition) as avg_annual_tuition FROM Course GROUP BY university_id`
      )

      let obj = {};
      avg.forEach(value => {
         obj[value.university_id] = value.avg_annual_tuition
      })
      let courseIds = new Set();
      
      let out = []
      if (result.length > 0) {
         result.forEach(value => {
            if (!courseIds.has(value.course_id)) {
               courseIds.add(value.course_id)
               out.push({
                  course: {
                     id: value.course_id,
                     name: value.course_name,
                     annual_tuition: {
                        currency: value.currency,
                        value: value.annual_tuition
                     },
                     education_level: {
                        id: value.level_id,
                        name: value.level_name
                     }
                  },
                  university: {
                     id: value.university_id,
                     name: value.university_name,
                     avg_annual_tuition: {
                        currency: value.currency,
                        value: obj[value.university_id]
                     },
                     country: {
                        id: value.country_id,
                        name: value.country_name,
                     }
                  },
                  scholarships: [
                     {
                        id: value.scholarship_id,
                        name: value.scholarship_name
                     }
                  ]
               })
            } else {
               out.find(({ course, scholarships }) => {
                  if (course.id == value.course_id) {
                     scholarships.push({
                        id: value.scholarship_id,
                        name: value.scholarship_name
                     })
                  }
               })
            }
            
         })
         res.status(200).json(out)
      } else {
         res.status(200).json({ message: "No records found"})
      }
      
   } catch (error) {
      console.log(error)
      return res.status(500).json(error.message)
   }
   
})

app.listen(5000, async () => {
   console.log('App started on port 5000')
   conn = await mysql.createConnection({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PSWD,
      database: config.DB_NAME,
      port: config.DB_PORT
   })
})

