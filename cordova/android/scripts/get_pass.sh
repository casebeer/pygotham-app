#!/bin/bash

function get_pass {
	SERVICE_NAME="${1}"
	(security -q find-generic-pass -s "${SERVICE_NAME}" -g >/dev/null) 2>&1 | sed -e 's/^password: "\(.*\)"$/\1/' #| tr -d '\n'
	return ${PIPESTATUS[0]}
}

get_pass "$1"

