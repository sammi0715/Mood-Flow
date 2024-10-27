import React, { createContext, useContext, useReducer } from "react";

const initialState = {
  common: {
    isMenuOpen: false,
    alertMessage: null,
    alertConfirm: null,
    showConfirmDialog: false,
    confirmMessage: "",
    confirmAction: null,
    loading: false,
  },
  community: {
    friends: [],
    friendRequests: [],
    selectedFriend: null,
    selectedFriendDiaries: [],
    loadingDiaries: false,
    error: null,
    diaryComments: {},
    likeStatuses: {},
    showCommentInput: {},
  },
  diaryCalendar: {
    diaries: [],
    currentDate: new Date(),
  },
  newDiaryEntry: {
    selectedMood: null,
    diaryContent: "",
    uploadedImages: [],
    selectedTrack: null,
  },
  viewDiaryEntry: {
    diary: null,
    loading: true,
    isEditing: false,
    updatedContent: "",
    updatedMood: "",
    updatedTrack: null,
    updatedImages: [],
    uploadedImages: [],
    isFriendsListOpen: false,
    likes: [],
    comments: [],
    showCommentInput: {},
  },
};

function appReducer(state, action) {
  switch (action.type) {
    case "TOGGLE_MENU":
      return { ...state, common: { ...state.common, isMenuOpen: !state.common.isMenuOpen } };
    case "SET_ALERT":
      return {
        ...state,
        common: {
          ...state.common,
          alertMessage: action.payload.message,
          alertConfirm: action.payload.confirm,
        },
      };
    case "CLEAR_ALERT":
      return { ...state, common: { ...state.common, alertMessage: null, alertConfirm: null } };
    case "SET_CONFIRM_DIALOG":
      return {
        ...state,
        common: {
          ...state.common,
          showConfirmDialog: action.payload.show,
          confirmMessage: action.payload.message,
          confirmAction: action.payload.action,
        },
      };
    case "SET_LOADING":
      return { ...state, common: { ...state.common, loading: action.payload } };

    // Community actions
    case "SET_FRIENDS":
      return {
        ...state,
        community: {
          ...state.community,
          friends: action.payload,
        },
      };

    case "TOGGLE_FRIENDS_LIST":
      return {
        ...state,
        community: {
          ...state.community,
          isFriendsListOpen: !state.community.isFriendsListOpen,
        },
      };

    case "SET_FRIEND_REQUESTS":
      return {
        ...state,
        community: {
          ...state.community,
          friendRequests: action.payload,
        },
      };

    case "SET_SELECTED_FRIEND":
      return {
        ...state,
        community: {
          ...state.community,
          selectedFriend: action.payload,
        },
      };

    case "SET_SELECTED_FRIEND_DIARIES":
      return {
        ...state,
        community: {
          ...state.community,
          selectedFriendDiaries: action.payload,
        },
      };

    case "SET_LOADING_DIARIES":
      return {
        ...state,
        community: {
          ...state.community,
          loadingDiaries: action.payload,
        },
      };

    case "SET_ERROR":
      return {
        ...state,
        community: {
          ...state.community,
          error: action.payload,
        },
      };

    case "SET_DIARY_COMMENTS":
      return {
        ...state,
        community: {
          ...state.community,
          diaryComments: {
            ...state.community.diaryComments,
            ...action.payload,
          },
        },
      };

    case "SET_LIKE_STATUSES":
      return {
        ...state,
        community: {
          ...state.community,
          likeStatuses: {
            ...state.community.likeStatuses,
            ...action.payload,
          },
        },
      };

    case "TOGGLE_COMMENT_INPUT":
      return {
        ...state,
        community: {
          ...state.community,
          showCommentInput: {
            ...state.community.showCommentInput,
            [action.payload]: !state.community.showCommentInput[action.payload],
          },
        },
      };

    case "UPDATE_LIKE_STATUS":
      return {
        ...state,
        community: {
          ...state.community,
          likeStatuses: {
            ...state.community.likeStatuses,
            [action.payload.diaryId]: action.payload.likes,
          },
        },
      };

    // DiaryCalendar actions
    case "SET_DIARIES":
      return { ...state, diaryCalendar: { ...state.diaryCalendar, diaries: action.payload } };
    case "SET_CURRENT_DATE":
      return { ...state, diaryCalendar: { ...state.diaryCalendar, currentDate: action.payload } };

    // NewDiaryEntry actions
    case "SET_SELECTED_MOOD":
      return { ...state, newDiaryEntry: { ...state.newDiaryEntry, selectedMood: action.payload } };
    case "SET_DIARY_CONTENT":
      return { ...state, newDiaryEntry: { ...state.newDiaryEntry, diaryContent: action.payload } };
    case "ADD_UPLOADED_IMAGE":
      return {
        ...state,
        newDiaryEntry: {
          ...state.newDiaryEntry,
          uploadedImages: [...state.newDiaryEntry.uploadedImages, action.payload],
        },
      };
    case "REMOVE_UPLOADED_IMAGE":
      return {
        ...state,
        newDiaryEntry: {
          ...state.newDiaryEntry,
          uploadedImages: state.newDiaryEntry.uploadedImages.filter(
            (_, index) => index !== action.payload
          ),
        },
      };
    case "SET_SELECTED_TRACK":
      return { ...state, newDiaryEntry: { ...state.newDiaryEntry, selectedTrack: action.payload } };

    case "RESET_NEW_DIARY_STATE":
      return {
        ...state,
        newDiaryEntry: {
          selectedMood: null,
          diaryContent: "",
          uploadedImages: [],
          selectedTrack: null,
          loading: false,
        },
      };

    case "RESET_VIEW_DIARY_STATE":
      return {
        ...state,
        viewDiaryEntry: {
          ...initialState.viewDiaryEntry,
          diary: null,
          loading: true,
          isEditing: false,
          updatedContent: "",
          updatedMood: "",
          updatedTrack: null,
          updatedImages: [],
          uploadedImages: [],
          isFriendsListOpen: false,
          likes: [],
          comments: [],
          showCommentInput: {},
        },
      };
    case "SET_DIARY":
      return {
        ...state,
        viewDiaryEntry: {
          ...state.viewDiaryEntry,
          diary: action.payload,
          updatedContent: action.payload.content,
          updatedMood: action.payload.mood,
          updatedTrack: action.payload.track,
          updatedImages: action.payload.imageUrls || [],
          loading: false,
        },
      };
    case "SET_EDITING":
      return { ...state, viewDiaryEntry: { ...state.viewDiaryEntry, isEditing: action.payload } };
    case "UPDATE_CONTENT":
      return {
        ...state,
        viewDiaryEntry: { ...state.viewDiaryEntry, updatedContent: action.payload },
      };
    case "UPDATE_MOOD":
      return { ...state, viewDiaryEntry: { ...state.viewDiaryEntry, updatedMood: action.payload } };
    case "UPDATE_TRACK":
      return {
        ...state,
        viewDiaryEntry: { ...state.viewDiaryEntry, updatedTrack: action.payload },
      };
    case "ADD_UPDATED_IMAGE":
      return {
        ...state,
        viewDiaryEntry: {
          ...state.viewDiaryEntry,
          updatedImages: [...state.viewDiaryEntry.updatedImages, action.payload],
        },
      };
    case "REMOVE_UPDATED_IMAGE":
      return {
        ...state,
        viewDiaryEntry: {
          ...state.viewDiaryEntry,
          updatedImages: state.viewDiaryEntry.updatedImages.filter(
            (_, index) => index !== action.payload
          ),
        },
      };
    case "SET_LIKES":
      return { ...state, viewDiaryEntry: { ...state.viewDiaryEntry, likes: action.payload } };
    case "SET_COMMENTS":
      return { ...state, viewDiaryEntry: { ...state.viewDiaryEntry, comments: action.payload } };
    default:
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
