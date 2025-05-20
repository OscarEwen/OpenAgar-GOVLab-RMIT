# Used to control python bots

import argparse
from pathlib import Path

# Initialise parser
parser = argparse.ArgumentParser(
    description="Spawn and command multiple bots of a given script"
    )

# Add arguments
parser.add_argument('-s', '--script', action='append', nargs=2)

# Read arguments from the command line as a dictionary
args = vars(parser.parse_args())

script_list_pairs = args['script']

# If the argument has been entered, convert into a dictionary of the first value mapped to the second
if (script_list_pairs):
    script_pairs = dict(script_list_pairs)

    for key, value in script_pairs.items():
        if (not Path(key).exists()):
            print('Script does not exist, skipping')
else:
    print('No scripts entered')