import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import style from "./style.module.scss"
import { _app } from "@/app/_app"
import functions from "@/data/module/functions"
import clsx from "clsx/lite"
import * as workSpaceType from "../../types/workSpaceType"
import { EmptyAccount, EmptyAccountOption } from "../../core/appStorage"
import { NOW_STORAGE, READY, SET_READY, SET_STORAGE_SELECT_MODE, WSA, isLogin, setDisplayDesktop, setIsLogin, setNowSaveInfo, setUsrIndx } from "../../core/globals"
import { setNowSetting } from "../../core/helpers"
import { Background } from "../../ui/DesktopParts"

export const Login = () => {
  const [userList, setUserList] = useState<workSpaceType.Unit.SaveInfo[]>([])
  const [userWorkSpaceList, setUserWorkSpaceList] = useState<workSpaceType.WorkSpaces.Setting[]>([])

  const [appStatus, setAppStatus] = useState<workSpaceType.App | null>(null)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [START, SET_START] = useState<boolean>(false)

  const refreshUserList = useCallback(async () => {
    const userIds = await WSA.listUsers();
    const users: workSpaceType.Unit.SaveInfo[] = [];
    const workspaces: workSpaceType.WorkSpaces.Setting[] = [];

    for (const id of userIds) {
      try {
        const u = await WSA.getSaveInfo(id);
        const s = await (await WSA.userState(id)).get();
        users.push(u);

        const wsSetting = await WSA.getWorkspaceInfo(id, s.nowWorkSpace, "setting");
        workspaces.push(wsSetting);

      } catch (e) {
        console.error("Failed to load user:", id, e);
      }
    }
    setUserList(users);
    setUserWorkSpaceList(workspaces);
    return { users, workspaces };
  }, []);

  const [selectUser, setSelectUser] = useState<number>(0)
  const [newAccount, setNewAccount] = useState<boolean>(false)

  const cfmPassRef = useRef<string>("")
  const newAccInfoRef = useRef<EmptyAccountOption>({
    name: "",
    id: "",
    color: "#ffffff"
  })

  const storageSelectMode = useCallback(() => {
    SET_READY(false)
    SET_STORAGE_SELECT_MODE(true)
  }, [])

  useEffect(() => {
    (async () => {
      while (!READY) {
        await functions.timeSleep(50);
      }

      let status: workSpaceType.App;
      try {
        status = await WSA.getAppStatus();
      } catch (e) {
        status = { autoLogin: false };
      }
      setAppStatus(status);

      const { users } = await refreshUserList();

      if (users.length === 0) {
        setSelectUser(-1);
        setNewAccount(true);
      } else {
        setSelectUser(status.lastUser ?? 0);
      }
      setLoaded(true);
    })();
  }, [READY, refreshUserList]);

  const login = useCallback(async (passKey: string, usrIndex?: number, listOverride?: workSpaceType.Unit.SaveInfo[]) => {
    const targetIndex = usrIndex ?? selectUser;
    const targetList = listOverride || userList;
    const user = targetList[targetIndex];

    if (!user) return;

    const psKy = user.user.passKey;
    const isPassCorrect = psKy ? (psKy === passKey) : true;

    if (isPassCorrect) {
      setUsrIndx(user.id);

      try {
        const setting = await (await WSA.userSetting(user.id)).get();
        const saveInfo = await (await WSA.userSaveInfo(user.id)).get();

        setNowSetting(setting);
        setNowSaveInfo(saveInfo);
      } catch (error) {
        console.error("Failed to load user settings:", error);
      }

      setIsLogin(true);

      const newStatus = {
        ...(appStatus || { autoLogin: false }),
        lastUser: targetIndex,
        autoLogin: true,
        rememberPassword: passKey || ""
      };
      await WSA.setAppStatus(newStatus);
      setAppStatus(newStatus);

      setDisplayDesktop(true);
    } else {
      console.error("密碼錯誤");
    }
  }, [selectUser, userList, appStatus]);

  useEffect(() => {
    (async () => {
      if (!loaded || userList.length === 0 || !appStatus) return;
      const { lastUser = 0, autoLogin: auto, rememberPassword: pass } = appStatus;
      const user = userList[lastUser];

      if (auto && user) {
        const psKy = user.user.passKey;
        if (!psKy || (psKy && psKy === pass)) {
          setUsrIndx(user.id);
          setSelectUser(lastUser);
          setIsLogin(true);
          setNowSetting(await (await WSA.userSetting(user.id)).get())
          setNowSaveInfo(await (await WSA.userSaveInfo(user.id)).get())
          setDisplayDesktop(true)
        }
      }
    })();
  }, [loaded])

  const createAccount = useCallback(async () => {
    const newAcc = newAccInfoRef.current;
    if (!newAcc.id || !newAcc.name) {
      if (newAcc.name) {
        _app.throwNewNotic("The ID field is required");
      } else if (newAcc.id) {
        _app.throwNewNotic("The Name field is required");
      } else {
        _app.throwNewNotic("bruh where is your account information");
      }
      return;
    }

    try {
      _app.throwNewNotic("creating data...");
      await WSA.newUser(newAcc);
      await functions.timeSleep(150);

      const { users: freshList } = await refreshUserList();

      _app.throwNewNotic("nice");

      const newIndex = freshList.findIndex(u => u.id === newAcc.id);
      if (newIndex !== -1) {
        await login(newAcc.password || "", newIndex, freshList);
      } else {
        setNewAccount(false);
      }
    } catch (e) {
      console.error("Account Creation Error: " + e);
      _app.throwNewNotic("hmmmm fail to create account,chack the console");
    }
  }, [refreshUserList, login]);

  useEffect(() => {
    if (!loaded) return;
    if (!isLogin) {
      _app.setColor("#ffffff")
    } else {
      const lastUserIndex = appStatus?.lastUser ?? 0;
      const wsSetting = userWorkSpaceList[lastUserIndex];
      if (wsSetting) {
        _app.setColor(wsSetting.color);
      }
    }
  }, [isLogin, loaded, userWorkSpaceList, appStatus])

  useEffect(() => {
    if (loaded)
      setTimeout(() => {
        SET_START(true)
      }, .1e3);
  }, [loaded])

  useEffect(() => {
    const owo = Array.from(document.getElementsByClassName("passwordInput")) as HTMLInputElement[]
    owo.forEach(e => e.value = "")
  }, [selectUser, isLogin])

  const EmptyUser = useMemo(() => EmptyAccount({ name: "New Account", id: ".w." }), [])
  const emptyWs = useMemo(() => EmptyUser.workSpaces.find(ws => ws.id === EmptyUser.state.nowWorkSpace) || EmptyUser.workSpaces[0], [EmptyUser])

  return (<div id={style["Login"]} className={clsx(!START && style["hide"])}>

    <div className={style["UserList"]}>
      <div>
        {
          userList.map((_user, i) => {
            const { user, id } = _user;
            const wsSetting = userWorkSpaceList[i];
            const clr = wsSetting?.color || "#ffffff";

            return <button
              key={`${i}_${id}`}
              className={style["User"]}
              style={{ outlineColor: i === selectUser ? clr + "50" : "" }}
              onClick={() => { setSelectUser(i); setNewAccount(false); }}
            >
              <div className={style["Main"]}>
                <div className={style["avatar"]}><Background className={style["Background"]} bg={user.avatar} /></div>
                <div className={style["name"]} >
                  <span style={{ color: clr }}>{user.name}</span>
                </div>
              </div>
              <div className={style["Background"]} style={{ backgroundColor: clr }} />
            </button>
          })
        }
        <button
          key={`add_acc`}
          className={style["User"]}
          style={{
            outlineColor: -1 === selectUser ? emptyWs.setting.color + "50" : "",
            marginTop: "50px",
          }}
          onClick={() => { setSelectUser(-1); setNewAccount(true); }}
        >
          <div className={style["Main"]}>
            <div className={style["avatar"]}><Background className={style["Background"]} bg={EmptyUser.saveInfo.user.avatar} /></div>
            <div className={style["name"]} >
              <span style={{ color: emptyWs.setting.color }}>{EmptyUser.saveInfo.user.name}</span>
            </div>
          </div>
          <div className={style["Background"]} style={{ backgroundColor: emptyWs.setting.color }} />
        </button>
      </div>
    </div>

    <div className={style["LoginBoard"]}>
      {
        userList.map((_user, i) => {
          const saveInfo = _user;
          const user = saveInfo.user;
          const { avatar, name } = user;
          return <div key={saveInfo.id} className={selectUser === i ? style["show"] : (selectUser > i ? style["up"] : style["down"])}>

            <div className={style["avatar"]}><Background className={style["Background"]} bg={avatar} /></div>
            <div className={style["name"]}>{name}</div>

            {
              user.passKey ?
                <div className={style["input"]}>
                  <input
                    type="password"
                    name={`_LABS/E621-API/ACCOUNT/${saveInfo.id}`}
                    placeholder="Password"
                    className={"passwordInput"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.code === "NumpadEnter") {
                        if (e.currentTarget.value) {
                          login(e.currentTarget.value)
                        }
                      }
                    }}
                  />
                </div>
                :
                <div className={style["button"]}>
                  <button onClick={() => { login("") }}>{"Login"}</button>
                </div>
            }
          </div>
        })
      }
      <div key={"new_account"} className={clsx(selectUser === -1 ? style["show"] : style["hide"], style["createAccount"])}>

        <h1>{"Create Account"}</h1>
        <div className={style["input"]}>
          <input
            type="text"
            placeholder="User Name"
            onInput={(e) => newAccInfoRef.current.name = e.currentTarget.value}
          />
        </div>

        <div className={style["input"]}>
          <input
            type="text"
            placeholder="User ID"
            onInput={(e) => newAccInfoRef.current.id = e.currentTarget.value}
          />
        </div>

        <div className={style["CLIP"]} />

        <div className={style["input"]}>
          <input
            type="password"
            placeholder="Password"
            onInput={(e) => newAccInfoRef.current.password = e.currentTarget.value}
          />
        </div>

        <div className={style["input"]}>
          <input
            type="password"
            placeholder="Password Again"
            onInput={(e) => cfmPassRef.current = e.currentTarget.value}
          />
        </div>

        <div className={style["CLIP"]} />

        <div className={style["input"]}>
          <span>{"Theme Color"}</span>
          <input
            type="color"
            defaultValue="#ffffff"
            onInput={(e) => newAccInfoRef.current.color = e.currentTarget.value}
          />
        </div>

        <div className={style["CLIP"]} />

        <div className={style["button"]}>
          <button
            onClick={() => {
              createAccount()
            }}
          >{"Create"}</button>
        </div>

      </div>

    </div>

    <div className={clsx(style["Backdrop"], newAccount && style["newAccount"])} />

    <div className={style["Backgrounds"]}>
      {userList.map((user, i) => {
        const wsSetting = userWorkSpaceList[i];
        return <div
          key={i}
          style={{ opacity: i === selectUser ? "1" : "0" }}
          className={clsx(
            style["img"],
            selectUser === i ? style["show"] : (selectUser > i ? style["up"] : style["down"])
          )}
        >
          {wsSetting && <Background className={style["Background"]} bg={wsSetting.wallpaper} />}
        </div>
      })}

      <div
        key={-1}
        style={{ opacity: -1 === selectUser ? "1" : "0" }}
        className={clsx(
          style["img"],
          selectUser === -1 ? style["show"] : style["hide"],
        )}
      >
        <Background className={style["Background"]} bg={(() => {
          const { saves } = EmptyUser
          const wallpaper = emptyWs.setting.wallpaper
          return typeof wallpaper === "number" ? saves.wallpapers[wallpaper] : wallpaper
        })()} />
      </div>
    </div>

    <div className={style["SelectStorage"]}>
      <button
        onClick={_ => storageSelectMode()}
      >
        <span className={style["hov-txt"]}>{`Change Storage`}</span>
        <span className={style["txt"]}>{`Now Storage [ ${NOW_STORAGE} ]`}</span>
      </button>
    </div>

  </div >)
}

/* ========================================================================================= */

