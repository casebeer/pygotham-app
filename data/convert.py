from BeautifulSoup import BeautifulSoup
import sys
import simplejson
import re

title_pat = re.compile("(.*):([^:]*)")
DEFAULT_FILE="talks.html"

def convert(in_f=DEFAULT_FILE):
	in_f = file(in_f, 'rb') if not hasattr(in_f, 'read') else in_f
	title_list, speaker_list, description_list = parse(in_f)
	return simplejson.dumps([dict(foo) for foo in zip(title_list, speaker_list, description_list)])
	
def parse(in_f=DEFAULT_FILE):
	in_f = file(in_f, 'rb') if not hasattr(in_f, 'read') else in_f
	soup = BeautifulSoup(in_f.read(), convertEntities=BeautifulSoup.HTML_ENTITIES)

	titles = soup.findAll("div", { "class" : "vote_titles" })
	descriptions = soup.findAll("div", { "class" : "vote_description" })

	title_data = [[t.strip() for t in title_pat.match(elt.text).groups()] for elt in titles]

	title_list = [("title", row[0]) for row in title_data]
	speaker_list = [("speaker", row[1]) for row in title_data]
	description_list = [("description", description.text) for description in descriptions]

	return title_list, speaker_list, description_list

if __name__ == "__main__":
	print convert(in_f=sys.stdin)
