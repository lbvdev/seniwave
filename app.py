from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_folder='static')

@app.route('/')
@app.route('/<path:path>')
def index(path=''):
    return render_template('index.html')

@app.route('/pages/<path:filename>')
def pages(filename):
    return send_from_directory('static/pages', filename)

@app.route('/<path:category>/<path:filename>')
def nested_pages(category, filename):
    return render_template('index.html')

if __name__ == '__main__':
    app.run('0.0.0.0', port=5200, debug=True)