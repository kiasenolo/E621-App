import { fs } from "./module/fs"
import { toFullscreen, exitFullscreen, toggleFullscreen } from "./module/fullscreen"
import htmlElement from "./module/htmlElement"
import makeZip from "./module/makeZip"
import type { consoleColorList, consoleStyleList } from "./type/console"
import { useEffect, useState } from "react"

export default {
  fullscreen: {
    full: toFullscreen,
    exit: exitFullscreen,
    toggle: toggleFullscreen,
  },
  makeZip,
  consoleTextColor: function (type: consoleColorList, text: string | number, end?: consoleColorList): string {
    const list = {
      Black: "\x1b[30m",
      Red: "\x1b[31m",
      Green: "\x1b[32m",
      Yellow: "\x1b[33m",
      Blue: "\x1b[34m",
      Magenta: "\x1b[35m",
      Cyan: "\x1b[36m",
      White: "\x1b[37m"
    }
    return `${list[type]}${text}${list[end || "White"]}`
  },
  consoleBgColor: function (type: consoleColorList, text: string | number, end: consoleColorList): string {
    const list = {
      Black: "\x1b[40m",
      Red: "\x1b[41m",
      Green: "\x1b[42m",
      Yellow: "\x1b[43m",
      Blue: "\x1b[44m",
      Magenta: "\x1b[45m",
      Cyan: "\x1b[46m",
      White: "\x1b[47m"
    }
    return `${list[type]}${text}${list[end || "Black"]}`
  },
  consoleTextStyle: function (type: consoleStyleList, text: string | number, end: consoleStyleList): string {
    const list = {
      Reset: "\x1b[0m",
      Bright: "\x1b[1m",
      Dim: "\x1b[2m",
      Underscore: "\x1b[4m",
      Blink: "\x1b[5m",
      Reverse: "\x1b[7m",
      Hidden: "\x1b[8m"
    }
    return `${list[type]}${text}${list[end || "Reset"]}`
  },
  download: function (content: string | Blob, fileName: string) {
    const a = document.createElement("a");

    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: "text/plain" });

    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = fileName;
    a.click();

    window.URL.revokeObjectURL(url);
  },
  readFile: function (file: File, content: (e: string | ArrayBuffer | null | undefined) => void, error?: (e: ProgressEvent<FileReader>) => void) {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      content(evt.target?.result)
    }
    reader.onerror = function (evt) {
      if (error) {
        error(evt)
      }
    }
  },
  replaceSpacesWithUnderscores: function (str: string): string {
    return str.replace(/\s+/g, '_');
  },
  numberArray: function (minVal: number, maxVal: number): Array<number> {
    function* sequenceGenerator(minVal: number, maxVal: number) {
      let currVal = minVal;

      while (currVal < maxVal)
        yield currVal++;
    }
    return Array.from(sequenceGenerator(minVal, maxVal + 1))
  },
  toBase64: function (content: string) {
    return btoa(encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
    }))
  },
  fromBase64: function (content: string) {
    return decodeURIComponent(Array.prototype.map.call(atob(content), function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  },
  dateFormat: (_date: number, format: string) => {
    /* 
     * :hh: - 12小時制的小時
     * :HH: - 24小時制的小時
     * :mm: - 分鐘
     * :ss: - 秒
     * 
     * -YY- - 四位數的年份
     * -yy- - 兩位數的年份
     * -MM- - 月
     * -mm- - 數字的月
     * -dd- - 日
     */
    const date = new Date(_date);

    const pad = (num: number) => {
      return num.toString().padStart(2, "0");
    };

    const str = (num: number) => {
      return num.toString()
    };

    const rep01 = format
      .replaceAll(":HH:", pad(date.getHours()))
      .replaceAll(":mm:", pad(date.getMinutes()))
      .replaceAll(":ss:", pad(date.getSeconds()))
      .replaceAll("-YY-", str(date.getFullYear()))
      .replaceAll("-yy-", str(date.getFullYear()).slice(-2))
      .replaceAll("-MM-", [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
      ][date.getMonth()])
      .replaceAll("-mm-", pad(date.getMonth() + 1))
      .replaceAll("-dd-", pad(date.getDate()))

    return rep01
  },
  afkClockTimer: function () {
    const [time, setTime] = useState<string>("--:--")
    const [timeS, setTimeS] = useState<string>("--:--:--")
    const [date, setDate] = useState<string>("- - -")
    const [week, setWeek] = useState<string>("-")
    const [timeCode, setTimeCode] = useState<number>(0)

    const [batteryLevel, setBatteryLevel] = useState<number>(Infinity)
    const [batteryCharging, setBatteryCharging] = useState<boolean>(true)

    useEffect(() => {
      const padNumber = (num: number) => num.toString().padStart(2, "0")

      const intervalId = setInterval(async () => {
        const time = new Date()

        setTimeCode(time.getTime())

        setTime(
          padNumber(time.getHours())
          + ":" +
          padNumber(time.getMinutes())
        )

        setTimeS(
          padNumber(time.getHours())
          + ":" +
          padNumber(time.getMinutes())
          + ":" +
          padNumber(time.getSeconds())
        )

        setDate(
          padNumber(time.getDate())
          + " " +
          [
            "January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"
          ][time.getMonth()]
          + " " +
          time.getFullYear()
        )

        setWeek([
          "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ][time.getDay()])

        try {
          const battery = await (navigator as any).getBattery()
          if (
            !(battery.charging && battery.level === 1 &&
              battery.chargingTime === Infinity &&
              battery.dischargingTime === Infinity)
          ) {

            setBatteryCharging(battery.charging)
            setBatteryLevel(battery.level)
          }
        } catch {
          setBatteryCharging(false)
          setBatteryLevel(-1)
        }
      }, 100)

      return () => clearInterval(intervalId)
    }, [])

    return {
      time,
      timeS,
      date,
      week,
      batteryLevel,
      batteryCharging,
      timeCode,
      getByFormat: (format: string) => this.dateFormat(timeCode, format)
    }
  },
  audioContext: {
    arrayBuffer: async function (url: string) {
      const response = await fetch(url);
      return await response.arrayBuffer();
    },
    playSomeAudio: async function (arrayBuffer: ArrayBuffer, volumeLevel: number) {
      const audioContext = new window.AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = volumeLevel;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      source.start();
    }
  },
  timeSleep: (ms: number) => new Promise(r => setTimeout(r, ms)),
  randomChoose: <T>(list: T[]): T | undefined => {
    if (!list || list.length === 0) {
      return undefined;
    }
    return list[Math.floor(Math.random() * list.length)];
  },
  clamp: function (value: number, min: number, max: number) {
    const clampedMin = Math.max(value, min);

    const finalClampedValue = Math.min(clampedMin, max);

    return finalClampedValue;
  },
  htmlElement,
  str: {
    capitalizeWords: (str: string) => {
      return str.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      });
    },
    mulit_with: (type: "end" | "start", fixs: string[], target: string) => {
      return fixs.some(fix => {
        switch (type) {
          case "end": return target.endsWith(fix)
          case "start": return target.startsWith(fix)
        }
      })
    },
    mulitStartWith: function (fixs: string[], target: string) { return this.mulit_with("start", fixs, target) },
    mulitEndWith: function (fixs: string[], target: string) { return this.mulit_with("end", fixs, target) },
  },
  fs
}
