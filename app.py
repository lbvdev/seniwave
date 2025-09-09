from flask import Flask, redirect, render_template, send_from_directory, url_for

app = Flask(__name__, static_folder='static')

@app.route('/')
@app.route('/<path:path>')
def index(path='', contact=''):
    if contact:
        return render_template('index.html', contact=True)
    return render_template('index.html')

@app.route('/<path:category>/<path:filename>')
def nested_pages(category, filename):
    return render_template('index.html')

@app.route('/pages/<path:filename>')
def pages(filename):
    return render_template('pages/' + filename)
    
@app.route('/contact')
def contact():
    return render_template('index.html', contact=True)


if __name__ == '__main__':
    app.run('0.0.0.0', port=5200, debug=True)