import clsx from 'clsx';
import { useState, useEffect, useMemo, Attributes, Key } from 'react';
import { Swiper, SwiperSlide, SwiperProps } from "swiper/react";
import "swiper/swiper-bundle.min.css";

export default function DaySlide({ actualDay, date, dayData, loading }) {
  const courses = dayData;
  const courseHourWrappers = [];
  const divCourses = [];
  if (courses != undefined) {  // It may be possible if a day is empty
    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i]
      divCourses.push(<Course courseData={courseData} />);
      courseHourWrappers.push(<CourseHours courseData={courseData} />);
    }
  } else {
    divCourses.push(
      <div className=''>
      </div>)
  }
  return (
    <SwiperSlide key={actualDay as Key}>
      <DayContainer>
        <DayContent courses={divCourses} coursesHours={courseHourWrappers} />
        <DayName name={actualDay} date={date} />
      </DayContainer>
    </SwiperSlide >
  );
}

function CourseHours({ courseData: course }) {
  const beginHour = Number(course.begin.slice(0, 2))
  const endHour = Number(course.end.slice(0, 2))
  const wrpBeginHour = beginHour   // Wrapper of half an hour long
  const wrpEndHour = endHour // Wrapping above the previous course
  const wrpRowBegin = (wrpBeginHour - 6) * 2 + (course.begin.slice(3, 5) == '30' ? 1 : 0)   // Half hours are 1 row in length and the day starts at 6am
  const wrpRowEnd = (wrpEndHour - 6) * 2 + (course.end.slice(3, 5) == '30' ? 1 : 0)   // Half hours are 1 row in length and the day starts at 7am
  const endHourPos = (wrpEndHour - 0.5 - 6) * 2 + (course.end.slice(3, 5) == '30' ? 1 : 0)   // Half hours are 1 row in length and the day starts at 7am
  return (
    <div className="Hours absolute inline-grid w-9 h-full grid-rows-27">
      <div className={clsx(" row-start-" + wrpRowBegin + " row-end-" + wrpRowEnd + " text-white\
    font-bold rounded-lg w-6 mx-auto relative bg-gradient-to-b \
  from-main-purple to-main-purple-light")}
        style={{ gridRowStart: wrpRowBegin, gridRowEnd: wrpRowEnd }}>
        <h3 className="text-center items-center text-[0.65rem] leading-[0.7rem] mt-1">
          {course.begin.slice(0, 3) + (course.begin.slice(3, 5) == 30 ? '\n' + course.begin.slice(3, 5) : '')}
        </h3>
      </div>
      <div className={"text-center items-center bottom-0 text-[0.65rem] row-span-1 row-start-" + endHourPos + " \
        leading-[0.7rem] w-full "}>
        <h3 className="mx-auto">
          {course.end.slice(0, 3) + (course.begin.slice(3, 5) == 30 ? '\n' + course.begin.slice(3, 5) : '')}
        </h3>
      </div>
    </div>
  )
}

function Course({ courseData: course }) {
  const beginHour = Number(course.begin.slice(0, 2))
  const endHour = Number(course.end.slice(0, 2))
  const rowBegin = (beginHour - 6) * 2 + (course.begin.slice(3, 5) == '30' ? 1 : 0)   // Half hours are 1 row in length and the day starts at 6am + 1 if half hour
  const rowEnd = (endHour - 6) * 2 + (course.end.slice(3, 5) == '30' ? 1 : 0)   // Half hours are 1 row in length and the day starts at 6am + if half hour
  return (
    <div key={course.begin} className={
      "Course w-full  text-gray-700 outline-2 outline-white relative\
      rounded-md  bg-gradient-to-b p-2 font-marianne\
      from-third-purple to-third-purple before:"+
      "row-start-" + rowBegin + " row-end-" + rowEnd + " "  // This doesnt work for some reasons
      + " text-xs font-normal text-start"}
      style={{
        gridRowStart: rowBegin, gridRowEnd: rowEnd,
        backgroundClip: '',
      }}>
      <div className="CourseHeader w-full h-1/2 inline-grid 
          grid-cols-10">
        <div className="CourseInfo text-start w-full h-full whitespace-nowrap absolute -left-[0.2rem]">
          <div className="overflow-hidden text-start items-baseline font-extrabold font-dinAlternate text-main-purple-dark
          text-xl ">{course.place + " "}</div>
        </div>
        <div className="CourseInfo relative text-start w-full 
            h-full whitespace-nowrap col-start-2 col-span-8 ">
          <div className="overflow-hidden font-bold text-sm drop-shadow-sm font-dinCondensed
            items-baseline">{course.name}</div>
        </div>
      </div>
      <div className="CourseContent w-[91%] h-6 ml-2 font-Cabin
          inline-grid grid-cols-4">
        <div className="CourseInfo text-start col-span-3 w-full 
            relative whitespace-nowrap">
          <div className="overflow-hidden font-Charter"> {course.teachers} </div>
        </div>
        <div className="CourseInfo text-start col-span-1 w-full 
            relative whitespace-nowrap">
          {/* <div className="overflow-hidden text-[0.5rem] text-end"> {course.classes} </div> */}
        </div>
      </div>
    </div>
  )
}

function DayContainer({ children }) {
  return (
    <div className="DayContainer w-full h-full text-lg flex 
    justify-center items-center">
      <div className="DayAbsoluteContainer absolute top-0 py-2 drop-shadow-md
      w-72 h-[95%] rounded-xl border-main-purple border-[1px] bg-white">
        {children}
      </div>
    </div>
  )
}

function DayContent({ courses, coursesHours }) {
  return (
    <div className="DayContent h-[89%] absolute top-2 flex justify-start">
      {coursesHours}
      <div className="CoursesContainer inline-grid grid-rows-27 w-60 mx-9">
        {courses}
      </div>
    </div>
  )
}

function DayName({ name, date }) {
  return (
    <div className="DayName absolute flex 
                  justify-center items-center flex-col text-center w-full 
                  bottom-0 h-[0.1428]">
      <h2 className="text-3xl font-light text-main-purple font-academyLET
                    translate-y-3">
        {name.toUpperCase()}
      </h2>
      <h4 className="text-xs font-normal mt-[0.1rem] text-gray-600 font-marianne">
        {date.toLocaleString("fr-FR", { year: 'numeric', month: '2-digit', day: '2-digit' })}
      </h4>
    </div>
  )
}