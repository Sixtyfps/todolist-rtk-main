import {TodolistDomainType, todolistsSlice, todolistsThunks} from "features/TodolistsList/todolistsSlice"
import {tasks, TasksStateType} from "features/TodolistsList/tasksSlice"
import {TodolistType} from "api/todolists-api"

test("ids should be equals", () => {
  const startTasksState: TasksStateType = {}
  const startTodolistsState: Array<TodolistDomainType> = []

  let todolist: TodolistType = {
    title: "new todolist",
    id: "any id",
    addedDate: "",
    order: 0,
  }

  const action = todolistsThunks.addTodolist.fulfilled({ todolist }, 'requestId',{ title: 'NewTitle' })

  const endTasksState = tasks(startTasksState, action)
  const endTodolistsState = todolistsSlice(startTodolistsState, action)

  const keys = Object.keys(endTasksState)
  const idFromTasks = keys[0]
  const idFromTodolists = endTodolistsState[0].id

  expect(idFromTasks).toBe(action.payload.todolist.id)
  expect(idFromTodolists).toBe(action.payload.todolist.id)
})
