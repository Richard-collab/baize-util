from flask import Flask, render_template

# 初始化 Flask 应用
# template_folder 指定 HTML 文件所在目录
# static_folder 指定 静态资源(css/js) 所在目录
app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def home():
    # 这里假设你的主页面是 tts.html，如果是其他文件请修改
    # Flask 会去 templates 文件夹里找这个文件
    return render_template('tts.html')

if __name__ == '__main__':
    # 启动服务，开启 debug 模式方便调试
    app.run(debug=True, port=5000)
