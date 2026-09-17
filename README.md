# 前线基地

一款原创的单机 2D 基地建设小游戏。建立兵营、生产步兵并清除五个中立目标。游戏完全在浏览器中运行，不需要账号、后端或网络资源。

在线游玩：https://laurelin11.github.io/frontier-outpost/

项目仓库：https://github.com/laurelin11/frontier-outpost

## 本地运行

双击本目录的 index.html，用 Chrome、Safari 或其他现代浏览器打开即可。也可以把整个目录放进任意静态网页服务器。三个运行文件 index.html、style.css、game.js 必须保持在同一目录。

## 操作

- 电脑：点击“建造兵营”，再点击地图上的合法空地。点击兵营后，点击“生产步兵”。左键选择单个步兵，拖框选择多个步兵；右键地面移动，右键中立目标攻击。
- Mac 触控板：可用双指点击下达右键指令，也可用界面的“移动”“攻击”按钮。
- 手机：横屏游玩。点按单位完成选择；点击“移动”或“攻击”，再点按地图中的地点或目标。建造和生产使用右侧按钮。
- 空格键暂停或继续，Esc 取消当前指令。顶部按钮可以暂停和重开。

资源会自动增长。兵营花费 180，步兵花费 70。清除全部中立目标获胜；基地被摧毁则失败。

## 更新与重新发布

1. 在本地修改对应文件并测试。运行 `node tests/smoke.cjs` 可以复查核心游戏流程。
2. 把修改后的文件提交到 [frontier-outpost 仓库](https://github.com/laurelin11/frontier-outpost) 的 `main` 分支。可直接在 GitHub 网页上编辑文件并提交。
3. 仓库的 GitHub Pages 已设置为从 `main` 分支的根目录发布。提交后等待部署完成，刷新上面的在线地址验证改动。
4. 如需检查或重新启用发布，打开仓库 Settings → Pages，确认 Source 为 Deploy from a branch、分支为 `main`、目录为 `/ (root)`，然后保存。

如果浏览器还显示旧版，先强制刷新页面。

## 文件

- index.html：页面结构
- style.css：界面与响应式布局
- game.js：游戏状态、输入、寻路、战斗与绘制
- tests/smoke.cjs：可重复的核心玩法验收脚本

所有画面由 Canvas 和 CSS 绘制，没有使用第三方游戏素材。
