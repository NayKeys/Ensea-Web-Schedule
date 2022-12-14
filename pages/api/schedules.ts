import { collection, setDoc, doc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { NextApiRequest, NextApiResponse } from 'next'
import { scheduleIDs, scheduleList } from '../../private/classesTree';
import fs from 'fs';
import path from 'path';
import ical from 'ical'
import { getWeekID } from '../../components/ews/lib/schoolYear';
import axios from 'axios'

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'POST') {
    res.status(200).json({status: 401, data: "Data not succesfully loaded cuz it's automatique now mf :3"})
  } else if (req.method == 'GET') {
    const now = new Date()
    const DELTA = 10*60*1000  // 10min
    updateAndSaveSchedule() // Process takes 30s on average
    if (req.headers['classe'] == undefined) {
      res.status(400).json({ status: 400, message: "Unsupported headers"});
      return
    }
    const classe = req.headers['classe']
    if (classe) {
      const schedules = JSON.parse(String(fs.readFileSync(path.join(process.cwd(), '/private/schedules.json'))), reviver)
      res.status(200).json({totalSchedule: JSON.stringify(schedules.get(classe), replacer)})
    } else {
      res.status(404).json({ status: 404, message:'No classe schedule found for this classe '+classe })
    }
  } else {
    res.status(400).json({ status: 400, message:'Only get and post request are handled' })
  }
}  // Get request of the entire shcedule of 1 year for every classe

function generateADEurl(schedule: number, begin: string, end: string) {
  const URL = 'https://ade.ensea.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?'+
  'resources='+schedule+'&projectId=1&calType=ical&firstDate='+begin+'&lastDate='+end
  return URL
}

export function replacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

export function reviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

import ProgressBar from 'progress'

const updateAndSaveSchedule = async () => {
  const progressBar = new ProgressBar('Updating from ADE - :percent (:bar) :schedule.',{
    total: Array.from(scheduleIDs.keys()).length,
    complete: '#',
    incomplete: ' ',
    width: 30,
    clear: true,
  })
  return new Promise(async (resolve) => {
    console.log('Starting new schedules update from ADE servers...')
    const beginTime = new Date()
    const scheduleJSONpath = path.join(process.cwd() + '/private/schedules.json')
    let schedules = new Map<String, {lastUpdate: Date, weeks: Map<number, Map<String, Course[]>>}>();  // Map of courses of day of week of schedule + last update
    for (const scheduleID of Array.from(scheduleIDs.keys())) {  // Iterate trough every classes and save their schedules
      const scheduleADEID = scheduleIDs.get(scheduleID)
      const res = await axios.get(generateADEurl(scheduleADEID, '2022-09-01', '2023-08-09'))  // Get request of the entire shcedule of 1 year for every classe
      const data = ADEisCringe(res.data)  // lol
      const calendar = ical.parseICS(data)  // Calendar is not iterable :)
      for (const[key, value] of Object.entries(calendar)) {  // Iterate through yearschedule courses
        const course = ADE_IS_OMEGA_FUCKING_CRINGE(parseCourseFromCalEvent(value))  // lol
        const schedule = schedules.get(scheduleID) ? schedules.get(scheduleID) : {lastUpdate: null, weeks: new Map<number, Map<string, Course[]>>()}
        if (!schedule.lastUpdate || new Date().getTime() - schedule.lastUpdate.getTime() < 5*60*1000) {  // If last update is older than 5min
          schedule.lastUpdate = new Date()
          const week = schedule.weeks.get(course.courseData.week) ? schedule.weeks.get(course.courseData.week) : new Map<String, Course[]>()
          const day = week.get(course.courseData.dayOfWeek) ? week.get(course.courseData.dayOfWeek) : []
          let includes = false
          for (const otherCourse of day) {  // Check if this course already exists in this schedule (happens with multiclasses courses)
            if (otherCourse.id == course.id) {
              includes = true
              break;
            }
          }
          if (!includes)
            day.push(course)
          week.set(course.courseData.dayOfWeek, day)
          schedule.weeks.set(course.courseData.week, week)
          schedules.set(scheduleID, schedule)
        }
        progressBar.tick(1, {
          schedule: scheduleID
        })
      }
    }
    fs.writeFileSync(scheduleJSONpath, JSON.stringify(schedules, replacer))  // Saved in 33ms 
    console.log('Schedules were succesfully updated in %d ms', (new Date().getTime() - beginTime.getTime()));
    resolve('done')
  })
}

function ADE_IS_OMEGA_FUCKING_CRINGE(course: Course): Course {
  // You might wonder : what is going on ?
  // Well this is simple, see aparently for every course dated before today are MODIFIED by ADE
  // I attended to some of those courses and I can confirm that every courses's hours are MODIFIED.
  // But this is not the case for the courses of the current week and the courses of every weeks after :)))
  // At this point I just wanna die I dont even want to continue typing this function this is just too CRINGE.
  
  // const currentWeekID = getWeekID(new Date())  // WeekID of this week
  // if (course.courseData.week < currentWeekID) {
  //   const begin = course.courseData.begin
  //   course.courseData.begin = ('0' + (Number(begin.slice(0, 2)) + 1)).slice(-2)  // I'm having so much fun right now. Btw this slice(-2) jutsu is from here https://www.folkstalk.com/2022/09/add-leading-zeros-to-number-javascript-with-code-examples.html#:~:text=JavaScript%20doesn't%20keep%20insignificant,padded%20with%20leading%20zeros%20string.
  //   course.courseData.begin += begin.slice(2, 5)
  //   const end = course.courseData.end
  //   course.courseData.end = ('0' + (Number(end.slice(0, 2)) + 1)).slice(-2)  // I'm having so much fun right now. Btw this slice(-2) jutsu is from here https://www.folkstalk.com/2022/09/add-leading-zeros-to-number-javascript-with-code-examples.html#:~:text=JavaScript%20doesn't%20keep%20insignificant,padded%20with%20leading%20zeros%20string.
  //   course.courseData.end += end.slice(2, 5)
  // }

  // pls send help.
  return course  // Apparently the problem has been handle on ADE side, I dont trust them this function stays there
}

function ADEisCringe(ADEdata: string) {
  
  const timezoneID = 'TZID=France/Paris'
  let data = ""
  const lines = ADEdata.split('\n') as string[]
  for (let line of lines) {
    if (line.startsWith('DTSTAMP') || line.startsWith('DTSTART') || line.startsWith('DTEND') || line.startsWith('LAST-MODIFIED')) {
      const ICSKey = line.split(':')[0]
      const ICSValue = line.split(':')[1]
      const ADEHour = Number(/T+\d{2}/.exec(ICSValue)[0].slice(1))
      const hourIndex = /T+\d{2}/.exec(ICSValue)[1]
      let realHour = String(ADEHour + (new Date().getHours() - new Date().getUTCHours()) + 1)  // Ade is substracting 1 hour to every damn courses
      realHour = Number(realHour) < 10 ? '0' + realHour : ''+realHour
      // line = ICSKey + ';' + timezoneID + ':' + ICSValue.replace('T'+ADEHour, 'T'+realHour) + '\n'
      line = ICSKey + ':' + ICSValue.replace('T'+ADEHour, 'T'+realHour) + '\n'
      data += line
    } else {
      data += line + '\n'
    }
  }
  return data
}

function removeSpaces(str: String) {
  let begin = 0
  let end = 0
  while (String(str).charAt(begin) === ' ') {
    begin++
  }
  while (str.charAt(str.length - 1 - end) === " ") {
    end++
  }
  return str.slice(begin, str.length - end)
}

function isClasseName(information: any) {
  return scheduleList.includes(information)
}

function parseCourseFromCalEvent(event: any): Course {
  const SCHOOL_YEAR = 2022
  const name = event.summary

  const teachers = [], classes = []
  const places = event.location.split(',')
  const informations = event.description.split('\n')
  let exportDate: string
  for (let i = 1; i < informations .length - 1; i++) {  // Ignoring first and last element
    const information = removeSpaces(informations [i])
    if (isClasseName(information)) {
      classes.push(information)
    } else if (information.startsWith('(Exported :')) {  // Weird data stuff inside the summary completly useless
      exportDate = information
    } else {
      teachers.push(information)
    }
  }
  const week = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const beginDate = (event.start as Date)
  const endDate = event.end as Date
  const creationDate = event.created as Date
  const modifiedDate = event.lastmodified as Date
  const weekID = getWeekID(beginDate)
  if (name != undefined) {
    const dayOfYear = (weekID - 1) * 7 + 1
    const date = new Date(SCHOOL_YEAR, 0, dayOfYear)
    const ID = event.uid
    const courseData = {
      name: name as string,
      dayOfWeek: week[beginDate.getDay()-1] as string,
      date: beginDate.toLocaleString("fr-FR", { year: 'numeric', month: '2-digit', day: '2-digit' }) as string,
      week: weekID as number,
      begin: beginDate.toLocaleString("fr-FR", { hour: '2-digit', minute: '2-digit' }) as string,
      end: endDate.toLocaleString("fr-FR", { hour: '2-digit', minute: '2-digit' }) as string,
      teachers: teachers as string[],
      locations: places as string[],
      creationDate: creationDate as Date,
      modificationDate: modifiedDate as Date,
      exported: exportDate as string,
    }
    // console.log('event', event)
    // console.log('course', course)
    for (let i = 0; i < classes.length; i++) {
      const classe = classes[i]
    }
    return { id: ID, courseData: courseData }
  }
}

export type Course = {
  id: string,
  courseData: {
    name: string,
    dayOfWeek: string,
    date: string,
    week: number,
    begin: string,
    end: string,
    teachers: string[],
    locations: string[],
    creationDate: Date,
    modificationDate: Date,
    exported: string
  }
}