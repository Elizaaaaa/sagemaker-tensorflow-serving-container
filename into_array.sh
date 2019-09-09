OUTPUT=($(python ./input.py | tr -d '[],'))

#declare -x -a INPUT_DATA=$OUTPUT
#declare -p INPUT_DATA

#curl -d '{"instances": $OUTPUT}' \
#        -H 'Content-Type: application/json' \
#        -H 'X-Amzn-SageMaker-Custom-Attrubutes: tfs-model-name=Reset50v2' \
#        -X POST http://localhost:8080/invocations

#declare -p OUTPUT

command=$'curl -d \'{"instances":'${OUTPUT[@]}$'}\' -H \'Content-Type: application/json\' -H \'X-Amzn-SageMaker-Custom-Attrubutes: tfs-model-name=Reset50v2\' -X POST http://localhost:8080/invocations'
echo $command

$command
