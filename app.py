from flask import Flask, render_template

app = Flask(__name__, static_folder='static')
r = render_template
@app.route('/')
@app.route('/<path:path>')
def index(path='', contact=''):
    if contact:
        return r('index.html', contact=True)
    return r('index.html')

@app.route('/<path:category>/<path:filename>')
def nested_pages(category, filename):
    return r('index.html')

@app.route('/pages/<path:filename>')
def pages(filename):
    return r('pages/' + filename)
    
@app.route('/contact')
def contact():
    return r('index.html', contact=True)


if __name__ == '__main__':
    app.run('0.0.0.0', port=5200, debug=True)