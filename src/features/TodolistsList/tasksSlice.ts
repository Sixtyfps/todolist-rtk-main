import {
    AddTaskArgs,
    TaskPriorities,
    TaskStatuses,
    TaskType,
    todolistsAPI,
    UpdateTaskModelType,
} from "api/todolists-api"
import {appActions} from "app/appSlice"
import {createSlice} from "@reduxjs/toolkit"
import {todolistsActions, todolistsThunks} from "features/TodolistsList/todolistsSlice"
import {createAppAsyncThunk} from "utils/createAppAsyncThunk"
import {handleServerAppError, handleServerNetworkError} from "utils"

const slice = createSlice({
    name: "tasks",
    initialState: {} as TasksStateType,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // .addCase(todolistsActions.addTodolist, (state, action) => {
            //     state[action.payload.todolist.id] = []
            // })

            // .addCase(todolistsActions.setTodolists, (state, action) => {
            //     action.payload.todolists.forEach((tl: any) => {
            //         state[tl.id] = []
            //     })
            // })
            .addCase(todolistsActions.clearTodoListsData, () => {
                return {}
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks
            })
            .addCase(addTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.task.todoListId]
                tasks.unshift(action.payload.task)
            })
            .addCase(removeTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex((task) => task.id === action.payload.taskId)
                if (index !== -1) {
                    tasks.splice(index, 1)
                }
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex((task) => task.id === action.payload.taskId)
                if (index !== -1) {
                    tasks[index] = {...tasks[index], ...action.payload.domainModel}
                }
            })
            .addCase(todolistsThunks.fetchTodolists.fulfilled, (state, action) => {
                action.payload?.todolists.forEach((tl) => {
                    state[tl.id] = []
                })
            })
            .addCase(todolistsThunks.removeTodolist.fulfilled, (state, action) => {
                delete state[action.payload.id]
            })
            .addCase(todolistsThunks.addTodolist.fulfilled, (state, action) => {
                state[action.payload.todolist.id] = []
            })

    },
})

// thunks
const fetchTasks = createAppAsyncThunk<{ tasks: TaskType[]; todolistId: string }, { todolistId: string }>(
    `${slice.name}/fetchTasks`,
    async (arg, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI
        try {
            dispatch(appActions.setAppStatus({status: "loading"}))
            const res = await todolistsAPI.getTasks(arg.todolistId)
            const tasks = res.data.items
            dispatch(appActions.setAppStatus({status: "succeeded"}))
            return {tasks, todolistId: arg.todolistId}
        } catch (e) {
            handleServerNetworkError(e, dispatch)
            return rejectWithValue(null)
        }
    },
)


export const removeTask = createAppAsyncThunk<{ taskId: string, todolistId: string }, { taskId: string, todolistId: string }>(
    `${slice.name}/removeTask`,
    async (arg, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI
        try {
            dispatch(appActions.setAppStatus({status: "loading"}))
            const res = await todolistsAPI.deleteTask(arg.todolistId, arg.taskId)
            if (res.data.resultCode === 0) {
                dispatch(appActions.setAppStatus({status: "succeeded"}))
                return {taskId: arg.taskId, todolistId: arg.todolistId}
            } else {
                handleServerAppError(res.data, dispatch)
                return rejectWithValue(null)
            }

        } catch (e) {
            handleServerNetworkError(e, dispatch)
            return rejectWithValue(null)
        }
    }
)

// export const _removeTaskTC =
//     (taskId: string, todolistId: string): AppThunk =>
//         (dispatch) => {
//           todolistsAPI.deleteTask(todolistId, taskId).then((res) => {
//             dispatch(tasksActions.removeTask({ taskId, todolistId }))
//           })
//         }


const addTask = createAppAsyncThunk<{ task: TaskType }, AddTaskArgs>(
    `${slice.name}/addTask`,
    async (arg, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI
        try {
            dispatch(appActions.setAppStatus({status: "loading"}))
            const res = await todolistsAPI.createTask(arg)
            if (res.data.resultCode === 0) {
                const task = res.data.data.item
                dispatch(appActions.setAppStatus({status: "succeeded"}))
                return {task}
            } else {
                handleServerAppError(res.data, dispatch)
                return rejectWithValue(null)
            }
        } catch (e) {
            handleServerNetworkError(e, dispatch)
            return rejectWithValue(null)
        }
    })

export const updateTask = createAppAsyncThunk<updateTaskArg, updateTaskArg>(
    `${slice.name}/updateTask`,
    async (arg, thunkAPI) => {
        const {dispatch, rejectWithValue, getState} = thunkAPI
        try {
            const state = getState()
            const task = state.tasks[arg.todolistId].find((t) => t.id === arg.taskId)
            if (!task) {
                console.warn("task not found in the state")
                return rejectWithValue(null)
            }

            const apiModel: UpdateTaskModelType = {
                deadline: task.deadline,
                description: task.description,
                priority: task.priority,
                startDate: task.startDate,
                title: task.title,
                status: task.status,
                ...arg.domainModel,
            }

            const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)
            if (res.data.resultCode === 0) {
                return arg
            } else {
                handleServerAppError(res.data, dispatch)
                return rejectWithValue(null)
            }
        } catch (e) {
            handleServerNetworkError(e, dispatch)
            return rejectWithValue(null)
        }
    },
)


export const tasks = slice.reducer
// export const tasksActions = slice.actions
export const tasksThunks = {fetchTasks, addTask, updateTask, removeTask}

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}

type updateTaskArg = { taskId: string; domainModel: UpdateDomainTaskModelType; todolistId: string }
type removeTaskArg = { taskId: string, todolistId: string }

export type TasksStateType = {
    [key: string]: Array<TaskType>
}
