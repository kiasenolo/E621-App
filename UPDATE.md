# inDev 0.0.2 更新日志

## 多了什麽？
現在有中英文切換器了 欸十分的好  
開始選單的東西也能drag了  
postSearch多了篩選器  
可以改頭貼了  
post和postSearch可以複製JSON  

多了一些快捷鍵
- postSearch
  - Shift + F (Filter)
  - Shift + J (JumpToPage)
- Desktop
  - Alt + , (最小化視窗)
  - Alt + -> (沾滿右半邊)
  - Alt + <- (沾滿左半邊)



## 修了什麽
視窗在全熒幕狀態被拽下來的時候 放開位置會回彈  
viewer在觸控的情況下 中心點會偏掉  
postSearch的reload不好用  

## 那請問 多了什麽問題
好消息 reload 好用了 壞消息 第一次開postSearch的時候 有機率會炸掉  
（可以在開始選單開控制臺看有沒有報錯 有的話就reload）  

## 給準備寫這個東西的開發者看的
`_app.tsx` 因爲 我實在懶惰的關係 所以 我把我原本的東西直接抓過來用的 會多一些沒用到的特性是正常的  
我們多了個叫 `dragItem()` 的東西 你現在不需要手動寫 `JSON.stringify` 和 `e.dataTransfer.setData` 了 太好了  
然後還有一個叫做 `e621Info()` 的東西 就 專門拿e621認證資訊 然後你可以填進去 user 裏面 啊 挺好  
還有 `menuBtn` 目前只放了兩個 一個是複製JSON的按鈕 一個是post的按鈕  
就這樣  