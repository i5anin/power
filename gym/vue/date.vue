<template>
  <table class="table" style="width: 500px">
    <thead>
      <tr>
        <th scope="col">Номер:</th>
        <th scope="col">Дата:</th>
        <th scope="col">День недели:</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ id }}</td>
        <th scope="row">{{ workout.date }}</th>
        <td>{{ workout.day_of_week }}</td>
      </tr>
    </tbody>
  </table>
</template>
