# Used to control python bots
import subprocess
import argparse
from pathlib import Path

# Initialise parser
parser = argparse.ArgumentParser(
    description="Spawn and command multiple bots of a given script"
    )

# Create object to track threads
thread_list = list()

# Add arguments
parser.add_argument('-s', '--script', action='append', nargs=2)

# Read arguments from the command line as a dictionary
args = vars(parser.parse_args())

script_list_pairs = args['script']

valid_script_dict = dict()

# If the argument has been entered, convert into a dictionary of the first value mapped to the second
if (script_list_pairs):
    script_pairs = dict(script_list_pairs)

    for key, value in script_pairs.items():
        if (Path(key).is_file()):
            if (value.isdigit() and int(value) > 0):
                if (Path(key).suffix == ".py"):
                    valid_script_dict[key] = int(value)
                else:
                    print(f'The file \"{key}\" is not a valid python file, skipping.')
            else:
                print(f'The entered value \"{value}\" is not valid, must be an integer above 0')
        else:
            # If entered script name is not a file, skip
            print(f'The file \"{key}\" does not exist, skipping.')
else:
    print('No scripts entered')

for script, quantity in valid_script_dict.items():
    for index in range(quantity):
        thread_list.append(
            subprocess.Popen(['python', script])
        )
    
    for thread in thread_list:
        thread.wait()