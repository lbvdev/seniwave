from flask import Flask, render_template, request, send_from_directory

app = Flask(__name__, static_folder='static')
r = render_template

def is_russian_domain():
    host = request.headers.get('Host', '').lower()
    return host.startswith('seniwave.ru') or host.startswith('localseniwave.ru')

def get_pages_path():
    return 'pages_ru/' if is_russian_domain() else 'pages/'

def return_index():
    if is_russian_domain():
        return r('index_ru.html', ru=True)
    else:
        return r('index.html')

@app.route('/')
def index():
    return return_index()

@app.route('/pages/<path:filename>')
def pages(filename):
    pages_path = get_pages_path()
    return r(pages_path + filename)

@app.route('/<path:path>')
def catch_all(path):
    return return_index()
    
@app.route('/contact')
def contact():
    return return_index()

#@app.route('static/presentation/t2')
#def presentation_t2():
#    return send_from_directory('static', 'presentation/game_concept_seniwave.pdf')


if __name__ == '__main__':
    app.run('0.0.0.0', port=5200, debug=True)