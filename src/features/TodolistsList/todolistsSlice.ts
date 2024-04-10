import {todolistsAPI, TodolistType} from "api/todolists-api"
import {appActions, RequestStatusType} from "app/appSlice"
import {AppThunk} from "app/store"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {createAppAsyncThunk, handleServerAppError, handleServerNetworkError} from "utils"

const slice = createSlice({
    name: "todolists",
    initialState: [] as TodolistDomainType[],
    reducers: {
        clearTodoListsData: () => {
            return []
        },
        // removeTodolist: (state, action: PayloadAction<{ id: string }>) => {
        //     const index = state.findIndex((todo) => todo.id === action.payload.id)
        //     if (index !== -1) {
        //         state.splice(index, 1)
        //     }
        // },
        // addTodolist: (state, action: PayloadAction<{ todolist: TodolistType }>) => {
        //     state.unshift({...action.payload.todolist, filter: "all", entityStatus: "idle"})
        // },
        changeTodolistTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) {
                state[index].title = action.payload.title
            }
        },
        changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) {
                state[index].filter = action.payload.filter
            }
        },
        changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string; status: RequestStatusType }>) => {
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) {
                state[index].entityStatus = action.payload.status
            }
        },
        // setTodolists: (state, action: PayloadAction<{ todolists: TodolistType[] }>) => {
        //     // return action.payload.todolists.map((tl) => ({ ...tl, filter: "all", entityStatus: "idle" }))
        //     action.payload.todolists.forEach((tl) => state.push({...tl, filter: "all", entityStatus: "idle"}))
        // },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTodolists.fulfilled, (state, action) => {
                action.payload.todolists.forEach((tl) => state.push({...tl, filter: "all", entityStatus: "idle"}))
            })
            .addCase(removeTodolist.fulfilled, (state, action) => {
                const index = state.findIndex((todo) => todo.id === action.payload.id)
                if (index !== -1) {
                    state.splice(index, 1)
                }
            })
            .addCase(addTodolist.fulfilled, (state, action) => {
                state.unshift({...action.payload.todolist, filter: "all", entityStatus: "idle"})
            })
    }
})


//-------------------THUNKS---------------------------------------------------

export const fetchTodolists = createAppAsyncThunk<{ todolists: TodolistType[] }>(
    `${slice.name}/fetchTodolists`,
    async (arg, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI
        try {
            dispatch(appActions.setAppStatus({status: "loading"}))

            const res = await todolistsAPI.getTodolists()
            const todolists = res.data
            dispatch(appActions.setAppStatus({status: "succeeded"}))
            return {todolists}
        } catch (e) {
            handleServerNetworkError(e, dispatch)
            return rejectWithValue(null)
        }
    }
)

export const removeTodolist = createAppAsyncThunk<{ id: string }, { id: string }>(
    `${slice.name}/removeTodolist`,
    async (arg, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI
        try {
            dispatch(appActions.setAppStatus({status: "loading"}))
            dispatch(todolistsActions.changeTodolistEntityStatus({id: arg.id, status: "loading"}))
            const res = await todolistsAPI.deleteTodolist(arg.id)

            if (res.data.resultCode === 0) {
                // dispatch(todolistsThunks.removeTodolist({id: arg.id}))
                dispatch(appActions.setAppStatus({status: "succeeded"}))
                return {id: arg.id}
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

export const addTodolist = createAppAsyncThunk<{todolist: TodolistType}, { title: string }>(
    `${slice.name}/addTodolist`,
    async (arg, thunkAPI) => {
        const {dispatch, rejectWithValue} = thunkAPI
        try {
            dispatch(appActions.setAppStatus({status: "loading"}))
            const res = await todolistsAPI.createTodolist(arg.title)
            // dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}))
            dispatch(appActions.setAppStatus({status: "succeeded"}))
            return {todolist: res.data.data.item}
        } catch (e) {
            handleServerNetworkError(e, dispatch)
            return rejectWithValue(null)
        }
    }
)

// export const _addTodolistTC = (title: string): AppThunk => {
//     return (dispatch) => {
//         dispatch(appActions.setAppStatus({status: "loading"}))
//         todolistsAPI.createTodolist(title).then((res) => {
//             dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}))
//             dispatch(appActions.setAppStatus({status: "succeeded"}))
//         })
//     }
// }

export const changeTodolistTitleTC = (id: string, title: string): AppThunk => {
    return (dispatch) => {
        todolistsAPI.updateTodolist(id, title).then((res) => {
            dispatch(todolistsActions.changeTodolistTitle({id, title}))
        })
    }
}

export const todolistsSlice = slice.reducer
export const todolistsActions = slice.actions
export const todolistsThunks = {fetchTodolists, removeTodolist, addTodolist}

// types
export type FilterValuesType = "all" | "active" | "completed"
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
