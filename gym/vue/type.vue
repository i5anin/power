<template>
  <table class="table" style="width: 500px">
    <thead>
      <tr>
        <th scope="col">Начало:</th>
        <th scope="col">Окончание:</th>
        <th scope="col">Всего:</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">{{ workout.start_time }}</th>
        <td>{{ workout.end_time }}</td>
        <td>{{ total_time }}</td>
      </tr>
    </tbody>
  </table>
</template>
