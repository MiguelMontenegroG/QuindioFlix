with open(r'C:\Users\ANGEL\Desktop\Universidad\202601\BaseDeDatosII\QuindioFlix\backend\routers\pagos.py', 'r') as f:
    content = f.read()
content = content.replace('        conn = get_connection()', '    conn = get_connection()')
with open(r'C:\Users\ANGEL\Desktop\Universidad\202601\BaseDeDatosII\QuindioFlix\backend\routers\pagos.py', 'w') as f:
    f.write(content)
print('Fixed')
