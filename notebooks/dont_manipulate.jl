using JSON
using Interact
using DataStructures
using Plots

macro dont_manipulate(args...)
  n = length(args)
  @assert 1 <= n <= 2

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

  cur_defaults = OrderedDict()
  cur_ranges = []

  for cur_binding in cur_bindings
    @assert cur_binding.head == :(=)
    cur_symbol, cur_range = cur_binding.args

    isa(cur_range, Expr) && ( cur_range = eval(cur_range) )
    isa(cur_range, Bool) && ( cur_range = [cur_range, !cur_range] )

    isa(cur_range, Symbol) && ( cur_range = eval(cur_range) )

    if isa(cur_range, Widget)
      work_default = cur_range.output.val
      work_range = cur_range.components[:formatted_vals]

      if !isa(work_default, AbstractString)
        work_range = map(
          work_range_value -> parse(typeof(work_default), work_range_value),
          work_range
        )
      end

      push!(cur_ranges, (string(cur_symbol), work_range))
      cur_defaults[string(cur_symbol)] = work_default
    else
      push!(cur_ranges, (string(cur_symbol), [collect(cur_range)...]))
    end
  end

  plot_tree = build_tree(
    compile_tree_dict(cur_block, cur_ranges)
  )

  for cur_node in plot_tree.nodes
    isa(cur_node, TreeNode) && continue
    cur_plot = eval(cur_node.value)

    IJulia.clear_output(true)
    display(cur_plot)

    cur_node.value = JSON.parse(json(
      Plots.plotlyjs_syncplot(cur_plot).plot
    ))
  end

  plot_json = tree_to_dict(plot_tree.root)

  json_dict = OrderedDict(
    "ranges" => cur_ranges,
    "defaults" => cur_defaults,
    "plots" => plot_json
  )

  if n == 1
    JSON.print(json_dict)
  else
    file_name = args[1]
    endswith(file_name, ".json") || ( file_name *= ".json" )

    open(file_name,"w") do cur_file
      JSON.print(cur_file, json_dict)
    end
  end

  return :($(json_dict))
end

function compile_tree_dict(cur_block, cur_ranges, cur_dict=OrderedDict())
  if isempty(cur_ranges)
    return cur_block
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
    sub_dict[cur_value] = compile_tree_dict(tmp_block, tmp_ranges, cur_dict)
  end

  return sub_dict
end

mutable struct TreeLeaf
  key::Union{Symbol,AbstractString,Number}
  value::Any
end

mutable struct TreeNode
  key::Union{Symbol,AbstractString,Number}
  children::Vector{Union{TreeNode, TreeLeaf}}
end

mutable struct TreeList
  root::Union{TreeNode, Nothing}
  nodes::Vector{Union{TreeNode, TreeLeaf}}
end

function build_node!(tree_list::TreeList, cur_key::Union{Symbol,AbstractString,Number}, nestedDict::AbstractDict)
  cur_children = []
  for (cur_key, cur_value) in nestedDict
    tmp_node = build_node!(tree_list, cur_key, cur_value)
    push!(cur_children, tmp_node)
  end

  cur_node = TreeNode(cur_key, cur_children)
  push!(tree_list.nodes, cur_node)
  return cur_node
end

function build_node!(tree_list::TreeList, cur_key::Union{Symbol,AbstractString,Number}, cur_value)
  cur_node = TreeLeaf(cur_key, cur_value)
  push!(tree_list.nodes, cur_node)
  return cur_node
end

function build_tree(nested_dict::AbstractDict)
  tree_list = TreeList(nothing, [])
  tree_list.root = build_node!(tree_list, :root, nested_dict)

  return tree_list
end

function tree_to_dict(cur_node::TreeLeaf)
  return cur_node.value
end

function tree_to_dict(cur_node::TreeNode)
  cur_dict = OrderedDict()
  for sub_node in cur_node.children
    cur_dict[sub_node.key] = tree_to_dict(sub_node)
  end
  return cur_dict
end

return
