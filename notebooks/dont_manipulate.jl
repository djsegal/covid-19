using JSON

macro dont_manipulate(args...)
  n = length(args)
  @assert n == 2

  expr = args[n]
  if expr.head != :for
      error("@manipulate syntax is @manipulate for ",
            " [<variable>=<domain>,]... <expression> end")
  end

  cur_block = expr.args[2]

  if expr.args[1].head == :block
    cur_bindings = expr.args[1].args
  else
    cur_bindings = [expr.args[1]]
  end

  cur_ranges = []

  for cur_binding in cur_bindings
    @assert cur_binding.head == :(=)
    cur_symbol, cur_range = cur_binding.args

    isa(cur_range, Expr) && ( cur_range = eval(cur_range) )
    isa(cur_range, Bool) && ( cur_range = [cur_range, !cur_range] )

    push!(cur_ranges, (string(cur_symbol), [collect(cur_range)...]))
  end

  file_name = args[1]
  endswith(file_name, ".json") || ( file_name *= ".json" )

  json_dict = OrderedDict(
    "ranges" => cur_ranges,
    "plots" => compileTree(cur_block, cur_ranges)
  )

  open(file_name,"w") do cur_file
    JSON.print(cur_file, json_dict)
  end

  return :($(json_dict))
end

function compileTree(cur_block, cur_ranges, cur_dict=OrderedDict())
  if isempty(cur_ranges)
    cur_plot = eval(cur_block)
    display(cur_plot)

    cur_json = Plots.plotlyjs_syncplot(cur_plot).plot
    return cur_json
  end

  tmp_ranges = deepcopy(cur_ranges)
  cur_symbol, cur_range = popfirst!(tmp_ranges)

  sub_dict = OrderedDict()

  for cur_value in cur_range
    tmp_block = deepcopy(cur_block)

    if isa(cur_value, Symbol)
      work_block = quote
        $(Symbol(cur_symbol)) = Symbol($(cur_value))
      end
    else
      work_block = :( $(Symbol(cur_symbol)) = $(cur_value) )
    end

    insert!(tmp_block.args, 2, work_block)

    sub_dict[cur_value] = compileTree(tmp_block, tmp_ranges, cur_dict)
  end

  return sub_dict
end
