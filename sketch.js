let data;
let dataChart;
let resultsArray;
let columns;

function preload() {
  rawData = loadTable('Raw_data.csv', 'csv', 'header');
}


function setup() {
  noCanvas();

  // Cleaning the data and setting up desired columns
  let columnsToKeep = ['DisplaycName', 'dIntervalStart', 'cReportGroup', 'nEnteredAcd', 'nAnsweredAcd', 'tTalkAcd', 'tAcw'];
  let columnsToAdd = ['Queue', 'Date', 'Time', 'State', 'Entered', 'Answered', 'Acw'];

  let cleanData = new p5.Table();
  columnsToAdd.forEach(element => cleanData.addColumn(element));

  columns = {
    queue: [],
    date: [],
    time: [],
    state: [],
    entered: [],
    answered: [],
    acw: []
  }

  function addColumnsToCleanData() {

    // adding queue, entered and answered
    columns.queue = rawData.getColumn('DisplaycName');
    columns.entered = rawData.getColumn('nEnteredAcd');
    columns.answered = rawData.getColumn('nAnsweredAcd');

    // adding date and time
    let dateTimeArray = rawData.getColumn('dIntervalStart');
    for (let i in dateTimeArray) {
      let str = dateTimeArray[i];
      let day = str.split('/')[0];
      if (day.length == 1) {
        day = "0" + day
      }
      let month = str.split('/')[1];
      let year = str.split('/')[2];
      newYear = year.split(' ')[0];
      let newDate = `${newYear}/${month}/${day}`;
      columns.date.push(newDate);
      let time = year.split(' ')[1];
      columns.time.push(time);
    }

    // adding state
    let clidArray = {
      'DNIS-+61295599580': "VIC",
      'DNIS-+61295599581': "INTERNAL",
      'DNIS-+61295599582': "INTERNAL",
      'DNIS-+61295599583': "NSW",
      'DNIS-+61295599584': "QLD",
      'DNIS-+61295599595': "INTERNAL",
      'DNIS-+61295599596': "INTERNAL",
      'DNIS-+61295599588': "INTERNAL",
      'DNIS-95599580': "VIC",
      'DNIS-95599583': "NSW",
      'DNIS-95599584': "QLD",
      'DNIS-9559958': "INTERNAL",
      '-': "INTERNAL",
      'Q-CS_Email': "EMAIL",
      'DNIS-+61295599586': "WA",
      'DNIS-+61295599587': "SA"
    }
    let clid = rawData.getColumn('cReportGroup');
    for (let i in clid) {
      columns.state.push(clidArray[clid[i]]);
    }

    // adding acw
    let tTalk = rawData.getColumn('tTalkAcd');
    let tAcw = rawData.getColumn('tAcw')

    for (let i in tTalk) {
      let newAcw = (int(tTalk[i]) + int(tAcw[i])) / int(columns.answered[i]);
      if (columns.answered[i] == 0) {
        newAcw = 0
      }
      columns.acw.push(round(newAcw));
    }

    // adding all to new table
    for (let i in columns.queue) {
      let newRow = cleanData.addRow();
      newRow.setString('Queue', columns.queue[i]);
      newRow.setString('Date', columns.date[i]);
      newRow.setString('Time', columns.time[i]);
      newRow.setString('State', columns.state[i]);
      newRow.setString('Entered', columns.entered[i]);
      newRow.setString('Answered', columns.answered[i]);
      newRow.setString('Acw', columns.acw[i]);
    }



  }

  addColumnsToCleanData();
  let obj = cleanData.getObject();

  function convertTime(x) {
    if (x.includes(':')) {
      let timeX = int(x.split(':')[0]);
      if (x.split(':')[1] == "30") {
        timeX += 0.5;
      }
      return timeX;
    }
  }


  let displayHeaders = createP(Object.keys(obj[0]).join(", "));


  let lists = {
    queueList: ["select a queue", "Q-Combined", "Q-General", "Q-CustomerSupport", "Q-DeliveryInbound"],
    timeList: [],
    dateList: [],
    createTimeList: function() {
      for (let i in obj) {
        if (!this.timeList.includes(obj[i].Time)) {
          this.timeList.push(obj[i].Time);
        }
      }
      this.timeList.sort((a, b) => {
        return convertTime(a) - convertTime(b);
      });
    },
    createDateList: function() {
      for (let i in obj) {
        if (!this.dateList.includes(obj[i].Date)) {
          this.dateList.push(obj[i].Date);
        }
      }
      this.dateList.sort();
      this.dateList.unshift("select a date");
    }
  }

  lists.createTimeList();
  lists.createDateList();

  // creating selectors
  let selectDate = createSelect();
  lists.dateList.forEach(element => selectDate.option(element));
  let selectQueue = createSelect();
  lists.queueList.forEach(element => selectQueue.option(element));
  let submitButton = createButton("Submit");

  chart();

  submitButton.mousePressed(() => {
    getData(selectDate.value(), selectQueue.value());
    dataChart.destroy();
    chart();
  });

  function chart() {
    var ctx = document.getElementById('myChart').getContext('2d');
    dataChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lists.timeList,
        datasets: [{
          label: 'Call Volume',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: resultsArray
        }]
      },
      options: {}
    });
  }


  function getData(day, queue = "Q-Combined", dataType = "Entered") {
    const {
      queueList,
      timeList,
      dateList
    } = lists;

    resultsArray = [];
    for (let t in timeList) {
      let sum = 0;
      for (let i in obj) {
        if (queue == queueList[0] || queue == queueList[1]) {
          if (obj[i].Time === timeList[t] && obj[i].Date === day) {
            sum += int(obj[i].Entered);
          }
        } else {
          if (obj[i].Queue === queue && obj[i].Time === timeList[t] && obj[i].Date === day) {
            sum += int(obj[i].Entered);
          }
        }
      }
      resultsArray.push(sum);
    }
    return resultsArray;
  }
}
