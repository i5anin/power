<template>
  <table class="table">
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">Упражнения</th>
        <th scope="col">Подход 1</th>
        <th scope="col">Подход 2</th>
        <th scope="col">Подход 3</th>
        <th scope="col">Подход 4</th>
        <th scope="col">Подход 5</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(exercise, index) in exercises" :key="index">
        <td>{{ index + 1 }}</td>
        <td>
          <h3>{{ exercise.name }}</h3>
          <p>Описание: {{ exercise.description }}</p>
        </td>
        <td>{{ exercise.name }}</td>
        <td v-for="(set, index) in exercise.sets" :key="index">
          {{ set.weight }}*{{ set.reps }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
