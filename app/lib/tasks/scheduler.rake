desc "This task updates all campaigns"
task :update_feed => :environment do
  puts "Updating feed..."
  NewsFeed.update
  puts "done."
end

# task :send_reminders => :environment do
#   # User.send_reminders
# end