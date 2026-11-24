# 知乎 S3 问答开发指南

项目基于 [Cinnamon/kotaemon](https://github.com/Cinnamon/kotaemon) 的 `9ad3e4e` 提交。前端由 Gradio 提供，与后端共用 Python 环境。以下命令在 Git 仓库根目录执行。

## 安装

使用 Python 3.10 和 [uv](https://docs.astral.sh/uv/getting-started/installation/)。复用仓库的 `uv.lock` 安装问答所需的基础依赖。

```bash
uv venv --python 3.10
uv export --frozen --no-dev --package kotaemon --package ktem --no-emit-workspace --no-hashes --no-annotate --output-file .venv/requirements.txt
uv pip install --python .venv --no-deps -r .venv/requirements.txt
uv pip install --python .venv --no-deps -e libs/kotaemon -e libs/ktem
```

复制 `.zhihu.env.example` 为 `.zhihu.env`，填入个人的 `ZHIHU_ACCESS_SECRET`。也可以通过同名环境变量配置凭证。项目的 Git 忽略规则会排除 `.zhihu.env`。 [知乎开放平台个人中心](https://developer.zhihu.com/profile)

## 启动

Linux 或 macOS

```bash
.venv/bin/python run_zhihu.py
```

Windows PowerShell

```powershell
.\.venv\Scripts\python.exe run_zhihu.py
```

本机启动后打开 <http://127.0.0.1:7860/>。在 Chat 页使用默认的 `zhihu` 模式提问。证据栏会展示知乎来源，回答中的编号与证据编号对应。保存密钥后重新提问即可。

默认监听 `127.0.0.1:7860`。可在启动前用环境变量 `GRADIO_SERVER_NAME` 和 `GRADIO_SERVER_PORT` 配置监听地址与端口。需要自定义密钥文件位置时，设置 `ZHIHU_ENV_FILE`。相对路径以仓库根目录为基准。

## 从本机访问远程服务

在连接服务器的 VS Code Remote SSH 窗口中打开「端口」，选择「转发端口」并输入远程端口 `7860`。用该行「转发地址」打开浏览器。本地端口已被占用时，VS Code 会选用另一个端口。 [VS Code 端口转发文档](https://code.visualstudio.com/docs/remote/ssh#_forwarding-a-port-creating-ssh-tunnel)

也可以在**自己电脑的终端**手动建立隧道，将命令中的 `your-ssh-host` 换成平时使用的 SSH 主机别名或 `用户名@服务器地址`。

```bash
ssh -NT -o ExitOnForwardFailure=yes -L 127.0.0.1:17860:127.0.0.1:7860 your-ssh-host
```

保持 SSH 终端开启，在本机打开 <http://127.0.0.1:17860/>。如果原有 SSH 配置使用 `RemoteForward` 或 `ssh -R`，从本机访问服务器上的服务时应使用上面的本地转发。

## 开发入口

- [问答实现](../libs/ktem/ktem/reasoning/zhihu.py)调用知乎搜索和直答，并将来源送到 Kotaemon 证据栏。
- [应用配置](../flowsettings.py)注册并默认选中知乎问答流程。
- 环境和本地数据分别保存在 `.venv/`、`.cache/` 和 `ktem_app_data/`。
