import paramiko
from scp import SCPClient

def copyfile(hostname, port, username, password, remote_path, local_path):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname, port=port, username=username, password=password)

        with SCPClient(ssh.get_transport()) as scp:
            scp.get(remote_path, local_path)
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        ssh.close()

hostname = '172.31.0.245' #Remote
port = 22
username = 'testusr'  #Remote
password = 'google123'  #Remote
remote_path = '/home/testusr/Projects/eLBcheck/MOSS/odc_copy.py' #Path linux or Path Remote
local_path =  r'C:\Users\google\Desktop\For_Practice\Test_Codecoppyremote'  #Main Computer

copyfile(hostname, port, username, password, remote_path, local_path)
