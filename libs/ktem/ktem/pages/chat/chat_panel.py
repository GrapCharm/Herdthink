import gradio as gr
from ktem.app import BasePage
from theflow.settings import settings as flowsettings

KH_DEMO_MODE = getattr(flowsettings, "KH_DEMO_MODE", False)

if not KH_DEMO_MODE:
    PLACEHOLDER_TEXT = (
        "This is the beginning of a new conversation.\n"
        "Start by uploading a file or a web URL. "
        "Visit Files tab for more options (e.g: GraphRAG)."
    )
else:
    PLACEHOLDER_TEXT = (
        "Welcome to Kotaemon Demo. "
        "Start by browsing preloaded conversations to get onboard.\n"
        "Check out Hint section for more tips."
    )


class ChatPanel(BasePage):
    def __init__(self, app):
        self._app = app
        self.on_building_ui()

    def on_building_ui(self):
        placeholder = PLACEHOLDER_TEXT
        input_placeholder = "Type a message, use @WebSearch, or tag a file with @filename"
        reasoning = self._app.default_settings.reasoning.settings["use"].value
        if reasoning == "zhihu" and not KH_DEMO_MODE:
            placeholder = (
                "直接输入问题，搜索知乎并查看带来源的回答。\n"
                "例如：为什么天空是蓝色的？"
            )
            input_placeholder = "输入你想在知乎了解的问题"
            gr.Markdown("[打开平行视角 · 探索同一材料的不同解读](/explore/)")

        self.chatbot = gr.Chatbot(
            label=self._app.app_name,
            placeholder=placeholder,
            show_label=False,
            elem_id="main-chat-bot",
            show_copy_button=True,
            likeable=True,
            bubble_full_width=False,
        )
        with gr.Row():
            self.text_input = gr.MultimodalTextbox(
                interactive=True,
                scale=20,
                file_count="multiple",
                placeholder=input_placeholder,
                container=False,
                show_label=False,
                elem_id="chat-input",
            )

    def submit_msg(self, chat_input, chat_history):
        """Submit a message to the chatbot"""
        return "", chat_history + [(chat_input, None)]
