// Загрузка данных из файла JSON
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    // Исходные данные
    var data = data;

    // Расчет среднего изменения потребления электроэнергии
    var totalChange = 0;
    for (var i = 1; i < data.length; i++) {
      totalChange += data[i].y - data[i - 1].y;
    }
    var averageChange = totalChange / (data.length - 1);

    // Генерация прогнозируемых данных
    var predictedData = [];
    var lastDataPoint = data[data.length - 1];
    var lastDate = luxon.DateTime.local().plus({ days: 1 }); // Start from tomorrow
    var lastPower = lastDataPoint.y;
    var daysInMonth = lastDate.daysInMonth;
    for (var i = lastDate.day; i <= daysInMonth; i++) {
      var nextDate = lastDate.set({ day: i });
      var nextPower = lastPower + averageChange;
      predictedData.push({ x: nextDate.toISO(), y: nextPower });
      lastPower = nextPower; // Update lastPower for the next iteration
    }

    // Конфигурация графика
    var ctx = document.getElementById("powerChart").getContext("2d");
    var chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Потребляемая мощность",
            data: data,
            borderColor: "#ff5c77", // красный
            fill: false
          },
          {
            label: "Прогнозируемая потребляемая мощность",
            data: predictedData,
            borderColor: "#2cbdd4", // синий
            fill: false,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: {
              tooltipFormat: "yyyy-MM-dd HH:mm",
              displayFormats: {
                hour: "HH:mm",
                day: "MMM dd"
              }
            },
            title: {
              display: true,
              text: "Дата"
            }
          },
          y: {
            title: {
              display: true,
              text: "Мощность (кВт)"
            }
          }
        }
      }
    });

    // Обработка отправки формы
    document.addEventListener("submit", function (event) {
      event.preventDefault();
      var powerInput = document.getElementById("powerInput");
      var power = parseFloat(powerInput.value);
      if (!isNaN(power)) {
        var now = luxon.DateTime.local();
        data.push({ x: now.toISO(), y: power });
        chart.update();

        // Обновление файла data.json с помощью API GitHub
        var jsonData = JSON.stringify(data, null, 2);
        updateDataFile(jsonData);

        powerInput.value = "";

        // Update the average power consumption values
        updateAveragePowerConsumption(data);
      }
    });

    // Calculate and display the initial average power consumption values
    updateAveragePowerConsumption(data);
  })
  .catch((error) => console.error(error));

// Функция для обновления файла data.json с помощью API GitHub
function updateDataFile(jsonData) {
  var url = "https://api.github.com/repos/i5anin/power/contents/data.json";
  var token = process.env.HUB_TOKEN;
  var branch = "main";
  var commitMessage = "Update data.json";

  var requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  };

  // Получение текущего SHA файла data.json
  fetch(url, requestOptions)
    .then((response) => response.json())
    .then((data) => {
      var sha = data.sha;

      // Обновление файла data.json
      requestOptions.method = "PUT";
      requestOptions.body = JSON.stringify({
        message: commitMessage,
        content: btoa(jsonData),
        sha: sha,
        branch: branch
      });

      fetch(url, requestOptions)
        .then((response) => response.json())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    })
    .catch((error) => console.error(error));
}

// Функция для расчета и отображения среднего потребления электроэнергии
function updateAveragePowerConsumption(data) {
  // Calculate the average power consumption during the day, night, and over 24 hours
  var dayPower = 0;
  var nightPower = 0;
  var dayCount = 0;
  var nightCount = 0;
  for (var i = 0; i < data.length; i++) {
    var date = luxon.DateTime.fromISO(data[i].x);
    if (date.hour >= 6 && date.hour < 18) {
      dayPower += data[i].y;
      dayCount++;
    } else {
      nightPower += data[i].y;
      nightCount++;
    }
  }
  var averageDayPower = dayPower / dayCount;
  var averageNightPower = nightPower / nightCount;
  var averageTotalPower = (dayPower + nightPower) / (dayCount + nightCount);

  // Add the calculated values to the page
  document.getElementById("averageDayPower").textContent =
    averageDayPower.toFixed(2);
  document.getElementById("averageNightPower").textContent =
    averageNightPower.toFixed(2);
  document.getElementById("averageTotalPower").textContent =
    averageTotalPower.toFixed(2);
}
