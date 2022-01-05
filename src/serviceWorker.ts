import {
  CREATE_NOTE,
  DELETE_NOTE,
  GET_ALL_NOTES,
  MOVE_NOTE,
  OPEN_OPTION_PAGE,
  RESIZE_NOTE,
  SET_ALL_NOTES,
  UPDATE_NOTE,
  UPDATE_NOTE_DESCRIPTION,
  UPDATE_NOTE_IS_FIXED,
  UPDATE_NOTE_IS_OPEN,
  UPDATE_NOTE_TITLE,
} from "./actions";
import { createNote, deleteNote, getAllNotes, updateNote } from "./interfaces/noteStorage";
import { ActionMesssageConfig } from "./types/Actions";

/**
 * Service Worker
 *
 * 1. ローカルストレージのデータを管理する
 *   1-1. ContentScriptからのアクションを受け取り、データを更新する
 *   1-2. ContentScriptへ、データを送信する
 *   1-3. Popupへ、データを送信する
 */

// install or Updateして初めて開いた時に呼ばれる。
chrome.runtime.onInstalled.addListener((details) => {
  const previousVersion = details.previousVersion || "x.x.x";
  console.log("previousVersion", previousVersion);
});

chrome.contextMenus.create({
  id: "note-extension-context-menu-create",
  title: "メモを追加",
  // title: chrome.i18n.getMessage("add_note_msg"),
});

const sampleNotes = [
  {
    id: 76533,
    page_info_id: 150872,
    title: "新しいメモ2",
    description: "ダブルクリックで編集",
    position_x: 86,
    position_y: 1425,
    width: 387,
    height: 309,
    is_open: true,
    is_fixed: false,
    created_at: "2021-12-29T06:00:55.581Z",
    updated_at: "2021-12-29T06:02:20.439Z",
  },
  {
    id: 76534,
    page_info_id: 150872,
    title: "fixedメモ",
    description: "ダブルクリックで編集",
    position_x: 627,
    position_y: 174,
    width: 387,
    height: 309,
    is_open: true,
    is_fixed: true,
    created_at: "2021-12-29T06:00:55.581Z",
    updated_at: "2021-12-29T06:02:20.439Z",
  },
  {
    id: 677675,
    page_info_id: 150872,
    title: "メモ1",
    description: "テキスト<br>",
    position_x: 627,
    position_y: 174,
    width: 300,
    height: 170,
    is_open: true,
    is_fixed: false,
    created_at: "2021-12-29T06:00:59.447Z",
    updated_at: "2021-12-29T06:05:17.978Z",
  },
  {
    id: 318058,
    page_info_id: 60158,
    title: "新しいメモ",
    description: "ダブルクリックで編集",
    position_x: 975,
    position_y: 1490,
    width: 300,
    height: 170,
    is_open: true,
    is_fixed: false,
    created_at: "2021-12-29T06:05:35.009Z",
    updated_at: "2021-12-29T06:05:38.209Z",
  },
  {
    id: 967499,
    page_info_id: 197174,
    title: "新しいメモ",
    description: "ダブルクリックで編集",
    position_x: 534.5,
    position_y: 836,
    width: 300,
    height: 170,
    is_open: true,
    is_fixed: false,
    created_at: "2021-12-30T00:02:57.102Z",
    updated_at: "2021-12-30T00:02:57.159Z",
  },
];

const samplePageInfo = [
  {
    id: 150872,
    page_url: "https%3A%2F%2Fcall.omnidatabank.jp%2Fblog%2Flocalstorage%2F",
    page_title:
      "ローカルストレージとCookieはどう違うの？ローカルストレージに書き込みしてみよう - Call Data Bank",
    fav_icon_url: "https://call.omnidatabank.jp/wp-content/uploads/favicon-1.png",
    created_at: "2021-12-29T06:02:33.626Z",
  },
  {
    id: 60158,
    page_url:
      "https%3A%2F%2Fstackoverflow.com%2Fquestions%2F5364062%2Fhow-can-i-save-information-locally-in-my-chrome-extension",
    page_title:
      "javascript - How can I save information locally in my chrome extension? - Stack Overflow",
    fav_icon_url: "https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico?v=ec617d715196",
    created_at: "2021-12-29T06:05:35.009Z",
  },
  {
    id: 197174,
    page_url:
      "https%3A%2F%2Fdeveloper.mozilla.org%2Fja%2Fdocs%2FMozilla%2FAdd-ons%2FWebExtensions%2FInteract_with_the_clipboard",
    page_title: "クリップボードとのやりとり - Mozilla | MDN",
    fav_icon_url: "https://developer.mozilla.org/favicon-48x48.97046865.png",
    created_at: "2021-12-30T00:02:57.100Z",
  },
  {
    id: 783094,
    page_url: "https%3A%2F%2Fwww.deepl.com%2Ftranslator",
    page_title: "DeepL翻訳：世界一高精度な翻訳ツール",
    fav_icon_url: "https://www.deepl.com/img/favicon/favicon_32.png",
    created_at: "2021-12-30T00:05:18.929Z",
  },
  {
    id: 938288,
    page_url:
      "https%3A%2F%2Fgithub.com%2FPocket%2Fterraform-modules%2Fblob%2Fmain%2Fsrc%2Fpocket%2FPocketALBApplication.ts",
    page_title: "terraform-modules/src/pocket at main · Pocket/terraform-modules",
    fav_icon_url: "https://github.githubassets.com/favicons/favicon-dark.svg",
    created_at: "2021-12-30T00:11:09.677Z",
  },
  {
    id: 325897,
    page_url:
      "https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Fdeepl-translate-beta-vers%2Fcofdbpoegempjloogbagkncekinflcnj%3Fhl%3Dja",
    page_title: "DeepL翻訳（ベータ版） - Chrome ウェブストア",
    fav_icon_url: "https://www.google.com/images/icons/product/chrome_web_store-32.png",
    created_at: "2021-12-30T00:11:54.610Z",
  },
  {
    id: 998395,
    page_url:
      "https%3A%2F%2Fgithub.com%2FPocket%2Fextension-save-to-pocket%2Fblob%2Fmaster%2Fsrc%2Fmanifest.json",
    page_title:
      "extension-save-to-pocket/manifest.json at master · Pocket/extension-save-to-pocket",
    fav_icon_url: "https://github.githubassets.com/favicons/favicon-dark.svg",
    created_at: "2021-12-30T00:23:12.639Z",
  },
];

chrome.contextMenus.onClicked.addListener(function (info) {
  console.log("onclick ", info);

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      console.log("contextMenus: no tabs.id");
      return;
    }

    createNote().then((notes) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: SET_ALL_NOTES, notes });
    });
  });
});

const contentScript = () => {
  console.log("=== contentScript ===");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs) {
      console.log("contentScript: no tabs.id");
      return;
    }

    console.log("contentScript:", tabs[0].id);

    // chrome.tabs.executeScript({ code: "console.log('executeScript')" });

    // chrome.tabs.executeScript({
    //   file: "contentScript.js",
    // });
  });
};

chrome.tabs.onActivated.addListener((activeInfo) => {
  // TODO タブが切り替えられた時に呼ばれる.
  contentScript();
});

const handleMessages = (
  action: ActionMesssageConfig,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log("==== handleMessage ====", action, sender);

  // TODO アクションの精査
  switch (action.method) {
    case GET_ALL_NOTES:
      getAllNotes().then((notes) => {
        console.log("GET_ALL_NOTES:", notes);

        sendResponse(notes);
      });
      return true;
    case CREATE_NOTE:
      createNote().then((notes) => {
        sendResponse(notes);
      });
      return true;
    case UPDATE_NOTE:
      updateNote(action.note || {})
        .then((notes) => {
          console.log("UPDATE_NOTE:", notes);

          sendResponse(notes);
        })
        .catch((e) => {
          console.log("error UPDATE_NOTE:", e);
        });

      return true;
    case UPDATE_NOTE_TITLE:
      // var updated_notes = this.state.notes;
      // if (updated_notes[action.index].title === action.title) { break; }
      // updated_notes[action.index].title       = action.title;
      // updated_notes[action.index].updated_at  = new Date().toISOString();
      // this.setState({notes: updated_notes});
      // save(UPDATE_NOTE_TITLE, updated_notes);
      break;
    case UPDATE_NOTE_DESCRIPTION:
      // var updated_notes = this.state.notes;
      // if (updated_notes[action.index].description === action.description) { break; }
      // updated_notes[action.index].description = action.description;
      // updated_notes[action.index].updated_at  = new Date().toISOString();
      // this.setState({notes: updated_notes});
      // save(UPDATE_NOTE_DESCRIPTION, updated_notes);
      break;
    case UPDATE_NOTE_IS_OPEN:
      // var updated_notes = this.state.notes;
      // updated_notes[action.index].is_open     = action.is_open;
      // updated_notes[action.index].updated_at  = new Date().toISOString();
      // this.setState({notes: updated_notes});
      // save(UPDATE_NOTE_IS_OPEN, updated_notes);
      break;
    case UPDATE_NOTE_IS_FIXED:
      // var updated_notes = this.state.notes;
      // updated_notes[action.index].is_fixed     = action.is_fixed;
      // const fix_position = updated_notes[action.index].is_fixed ? -1 : 1;
      // updated_notes[action.index].position_x += $(window).scrollLeft() * fix_position;
      // updated_notes[action.index].position_y += $(window).scrollTop() * fix_position;
      // if(updated_notes[action.index].position_x < 0){ updated_notes[action.index].position_x = 0; }
      // if(updated_notes[action.index].position_y < 0){ updated_notes[action.index].position_y = 0; }
      // updated_notes[action.index].updated_at  = new Date().toISOString();
      // this.setState({notes: updated_notes});
      // save(UPDATE_NOTE_IS_FIXED, updated_notes);
      break;
    case DELETE_NOTE:
      // var updated_notes = this.state.notes;
      // var delete_note   = this.state.notes[action.index];
      // updated_notes.splice(action.index, 1);
      // this.setState({notes: updated_notes});
      // delete_note(delete_note);
      deleteNote(action.note?.id)
        .then((notes) => {
          console.log("DELETE_NOTE:", notes);

          sendResponse(notes);
        })
        .catch((e) => {
          console.log("error DELETE_NOTE:", e);
        });
      return true;
    case MOVE_NOTE:
      // var updated_notes = this.state.notes;
      // if (updated_notes[action.index].position_x === action.position_x &&
      //   updated_notes[action.index].position_y === action.position_y) {
      //   break;
      // }
      // updated_notes[action.index].position_x = action.position_x;
      // updated_notes[action.index].position_y = action.position_y;
      // if (updated_notes[action.index].is_fixed) {
      //   updated_notes[action.index].position_x -= $(window).scrollLeft();
      //   updated_notes[action.index].position_y -= $(window).scrollTop();
      // }
      // if(updated_notes[action.index].position_x < 0){ updated_notes[action.index].position_x = 0; }
      // if(updated_notes[action.index].position_y < 0){ updated_notes[action.index].position_y = 0; }
      // updated_notes[action.index].updated_at = new Date().toISOString();
      // this.setState({notes: updated_notes});
      // save(MOVE_NOTE, updated_notes);
      break;
    case RESIZE_NOTE:
      // var updated_notes = this.state.notes;
      // if (!updated_notes[action.index].is_open) {
      //   break;
      // }
      // updated_notes[action.index].width       = action.width;
      // updated_notes[action.index].height      = action.height;
      // updated_notes[action.index].updated_at  = new Date().toISOString();
      // this.setState({notes: updated_notes});
      // save(RESIZE_NOTE, updated_notes);
      break;
    case OPEN_OPTION_PAGE:
      // open_option_page();
      break;
    default:
      break;
  }
};

chrome.runtime.onMessage.addListener(handleMessages);
